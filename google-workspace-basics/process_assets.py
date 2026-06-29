import os
import sys
import json

def process_pdf(pdf_path, output_dir):
    try:
        import fitz
    except ImportError:
        print("Error: PyMuPDF (fitz) is not installed. Please run: pip install pymupdf")
        sys.exit(1)
        
    try:
        from PIL import Image
    except ImportError:
        print("Error: Pillow is not installed. Please run: pip install pillow")
        sys.exit(1)

    print(f"Processing PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Convert PDF to PNGs with high resolution
    png_files = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
        png_name = f"slide_{i+1:02d}.png"
        png_path = os.path.join(output_dir, png_name)
        pix.save(png_path)
        png_files.append(png_name)
        print(f"Saved page {i+1} as PNG: {png_name}")
    doc.close()

    # 2. Resize PNGs to 1920x1080 JPGs to save space and keep high quality
    for f in png_files:
        png_path = os.path.join(output_dir, f)
        jpg_name = f.replace(".png", ".jpg")
        jpg_path = os.path.join(output_dir, jpg_name)
        
        img = Image.open(png_path).convert('RGB')
        img = img.resize((1920, 1080), Image.Resampling.LANCZOS)
        img.save(jpg_path, 'JPEG', quality=85)
        os.remove(png_path)
        print(f"Converted and resized to JPG: {jpg_name}")
        
    print("PDF processing complete!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_assets.py <pdf_path> <output_dir>")
        sys.exit(1)
    process_pdf(sys.argv[1], sys.argv[2])
