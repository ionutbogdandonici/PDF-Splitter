// Global reference to file
let uploadedFile = null;

// Elements references
const pdfFileInput = document.getElementById('pdf_file');
const startPageInput = document.getElementById('start_page');
const endPageInput = document.getElementById('end_page');
const startPagePreview = document.getElementById('start_page_preview');
const endPagePreview = document.getElementById('end_page_preview');
const pageCountText = document.getElementById('page_count_text');
const outputElement = document.getElementById('output');
const form = document.getElementById('pdf-form');

// API URLs
const API_BASE_URL = "http://127.0.0.1:8000";
const DIVIDE_URL = `${API_BASE_URL}/divide`;
const PREVIEW_URL = `${API_BASE_URL}/preview_page`;
const PAGE_COUNT_URL = `${API_BASE_URL}/get_page_count`;

// Event Listeners
pdfFileInput.addEventListener('change', handleFileChange);
startPageInput.addEventListener('input', () => updatePagePreview(startPageInput, startPagePreview))
endPageInput.addEventListener('input', () => updatePagePreview(endPageInput, endPagePreview))

// Functions
async function handleFileChange(event) {
    uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    try {
        const pageCount = await getPageCount(uploadedFile);
        pageCountText.textContent = `This document has a total of ${pageCount} pages.`;
        endPageInput.max = pageCount;
    } catch (error) {
        console.error("Error fetching page count:", error);
        pageCountText.textContent = `Error fetching page count: ${error}`;
    }

    if (startPageInput.value) {
        updatePagePreview(startPageInput, startPagePreview);
    }
    if (endPageInput.value) {
        updatePagePreview(endPageInput, endPagePreview);
    }
}

async function getPageCount(file) {
    const formData = new FormData();
    formData.append('pdf_file', file);

    const response = await fetch(PAGE_COUNT_URL, {
        method: 'POST',
        body: formData,
    })
    const data = await response.json();
    if (data.num_pages) {
        return data.num_pages;
    } else {
        throw new Error(data.error || "Unknown error");
    }
}

async function updatePagePreview(pageInput, imgElement) {
    if (!uploadedFile || !pageInput.value) return;

    try {
        const blob = await fetchPagePreview(uploadedFile, pageInput.value);
        imgElement.src = URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error fetching preview preview:", error);
    }
}

async function fetchPagePreview(file, pageNumber) {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('page_number', pageNumber);

    const response = await fetch(PREVIEW_URL, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Could not load page preview!");
    }

    return await response.blob();
}

async function dividePdf() {
    const formData = new FormData(form);

    try {
        const response = await fetch(DIVIDE_URL, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            outputElement.innerText = `Error: ${errorText}`;
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${formData.get("save_with_name")}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        outputElement.innerText = `Error: ${error}`;
    }
}