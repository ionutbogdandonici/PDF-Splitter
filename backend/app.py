from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader, PdfWriter
from pdf2image import convert_from_bytes
from io import BytesIO
import os
import logging

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/divide")
async def divide_pdf(pdf_file: UploadFile = File(...), start_page: int = Form(...), end_page: int = Form(...),
                     save_with_name: str = Form(...), ):
    # If the file is not a pdf file
    if not pdf_file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type, must be a .pdf!")

    pdf_bytes = await pdf_file.read()
    pdf_reader = PdfReader(BytesIO(pdf_bytes))
    pdf_writer = PdfWriter()

    start_page = start_page - 1
    end_page = end_page - 1
    num_pages = len(pdf_reader.pages)

    if start_page < 0 or end_page >= num_pages or start_page > end_page:
        raise HTTPException(status_code=400, detail="Invalid Interval!")

    for page_number in range(start_page, end_page + 1):
        pdf_writer.add_page(pdf_reader.pages[page_number])

    output = BytesIO()
    pdf_writer.write(output)
    output.seek(0)

    safe_file_name = os.path.basename(save_with_name) + ".pdf"

    return StreamingResponse(output, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={safe_file_name}"})


@app.post("/get_page_count")
async def get_page_count(pdf_file: UploadFile = File(...)):
    if not pdf_file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type, must be a .pdf!")

    pdf_bytes = await pdf_file.read()
    pdf_reader = PdfReader(BytesIO(pdf_bytes))
    num_pages = len(pdf_reader.pages)

    return {"num_pages": num_pages}


@app.post("/preview_page")
async def preview_page(pdf_file: UploadFile = File(...), page_number: int = Form(...)):
    # Log received page number and filename
    logger.info(f"Received page_number: {page_number}, file: {pdf_file.filename}")
    if not pdf_file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type, must be a .pdf!")

    try:
        pdf_bytes = await pdf_file.read()
        images = convert_from_bytes(pdf_bytes, first_page=page_number, last_page=page_number)
        if images:
            image = images[0]
            output = BytesIO()
            image.save(output, "PNG")
            output.seek(0)
            return StreamingResponse(output, media_type="image/png")
        else:
            raise HTTPException(status_code=404, detail="Page not found!")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
