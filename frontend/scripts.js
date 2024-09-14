// Global reference to file

let uploadedFile = null;

const pdfFileInput = document.getElementById('pdf_file');
const startPageInput = document.getElementById('start_page');
const endPageInput = document.getElementById('end_page');
const startPagePreview = document.getElementById('start_page_preview');
const endPagePreview = document.getElementById('end_page_preview');
const pageCountText = document.getElementById('page_count_text');

async function dividePdf() {
    const form = document.getElementById("pdf-form");
    const formData = new FormData(form);

    try {
        const response = await fetch("http://127.0.0.1:8000/divide", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = formData.get("save_with_name") + ".pdf";
            link.click();
            URL.revokeObjectURL(url);
        } else {
            const errorText = await response.text();
            document.getElementById("output").innerText = `Error: ${errorText}`;
        }
    } catch (error) {
        document.getElementById('output').innerText = `Error: ${error}`;
    }
}

async function fetchPagePreview(pageNumber, imgElement) {
    const file = pdfFileInput.files[0];

    const formData = new FormData();
    console.debug("File: ", file)
    console.debug("Page number: ", pageNumber);
    if (file && pageNumber) {
        formData.append("pdf_file", file);
        formData.append("page_number", pageNumber);
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/preview_page", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            imgElement.src = URL.createObjectURL(blob);
        } else {
            console.error("Error: Could not load page preview");
        }
    } catch (error) {
        console.error("Error fetching page preview: ", error);
    }
}

pdfFileInput.addEventListener("change", (event) => {

    uploadedFile = event.target.files[0];
    if (uploadedFile) {
        const formData = new FormData();
        formData.append("pdf_file", uploadedFile);
        fetch("http://127.0.0.1:8000/get_page_count", {
            method: "POST",
            body: formData
        }).then(response => response.json()).then(data => {
            if (data.num_pages) {
                pageCountText.textContent = `This document has a total of ${data.num_pages} pages.`;
                // The max number of end page
                endPageInput.max = data.num_pages;
            } else {
                pageCountText.textContent = `Error: ${data.error}.`
            }
        }).catch(error => {
            console.error("Error fetching page count: ", error);
            pageCountText.textContent = `Error fetching page count: ${error}`;
        })

        if (startPageInput.value) {
            fetchPagePreview(startPageInput.value, startPagePreview)
        }
        if (endPageInput.value) {
            fetchPagePreview(endPageInput.value, endPagePreview)
        }
    }
});

startPageInput.addEventListener("input", () => {
    if (uploadedFile) {
        fetchPagePreview(startPageInput.value, startPagePreview)
    }
})

endPageInput.addEventListener("input", () => {
    if (uploadedFile) {
        fetchPagePreview(endPageInput.value, endPagePreview)
    }
})