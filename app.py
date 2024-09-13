import os.path

from flask import Flask, render_template, request, send_file
from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO
from pdf2image import convert_from_bytes

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/divide", methods=['POST'])
def divide_pdf():
    # Obtaining uploaded file
    uploaded_file = request.files['pdf_file']
    if uploaded_file.filename == '':
        return "No file Uploaded!"
    if not uploaded_file.filename.endswith(".pdf"):
        return "Invalid file type, it must be a .pdf!"

    # Reset file pointer
    uploaded_file.seek(0)

    # Obtaining page intervals
    start_page = int(request.form['start_page']) - 1
    end_page = int(request.form['end_page']) - 1

    # Read PDF
    pdf_reader = PdfReader(uploaded_file)
    pdf_writer = PdfWriter()

    # Validate interval
    num_pages = len(pdf_reader.pages)
    if start_page < 0 or end_page >= num_pages or start_page > end_page:
        return "Invalid Interval"

    # Select pages
    for page_number in range(start_page, end_page + 1):
        pdf_writer.add_page(pdf_reader.pages[page_number])

    # Save pdf in buffer
    output = BytesIO()
    pdf_writer.write(output)
    output.seek(0)

    # Sanitization of save_with_name
    save_with_name = os.path.basename(request.form['pdf_file']) + ".pdf"

    # Return divided file
    return send_file(output, as_attachment=True, download_name=save_with_name, mimetype="application/pdf")


@app.route("/preview_page", methods=['POST'])
def preview_page():
    # Obtaining uploaded file
    uploaded_file = request.files['pdf_file']
    if uploaded_file.filename == "":
        return "No file uploaded", 400

    try:
        page_number = int(request.form['page_number']) - 1
    except ValueError:
        return "Invalid Page Number", 400

    try:
        pdf_bytes = uploaded_file.read()
        images = convert_from_bytes(pdf_bytes, first_page=page_number + 1, last_page=page_number + 1)
        if images:
            image = images[0]
            output = BytesIO()
            image.save(output, "PNG")
            output.seek(0)
            return send_file(output, mimetype="image/png")
        else:
            return "Page not found!", 404
    except Exception as e:
        return str(e), 500


if __name__ == "__main__":
    app.run(debug=True)
