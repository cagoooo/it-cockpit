# -*- coding: utf-8 -*-
import os
import sys

try:
    import fitz # PyMuPDF
except ImportError:
    print("Installing PyMuPDF...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import fitz

from PIL import Image

def convert_pdf_to_images(pdf_path, output_dir):
    if not os.path.exists(pdf_path):
        print(f"PDF not found: {pdf_path}")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # 高品質解析度 (Zoom Matrix)
        zoom = 4.167
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        # 暫存為 PNG
        png_path = os.path.join(output_dir, f"slide_{page_num+1:02d}.png")
        pix.save(png_path)
        
        # 使用 PIL 轉為 1920x1080 JPEG
        img = Image.open(png_path).convert('RGB')
        img_resized = img.resize((1920, 1080), Image.Resampling.LANCZOS)
        
        jpg_path = os.path.join(output_dir, f"slide_{page_num+1:02d}.jpg")
        img_resized.save(jpg_path, 'JPEG', quality=85)
        
        # 刪除暫存 PNG
        os.remove(png_path)
        print(f"Converted slide {page_num+1} to {jpg_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(current_dir, "assets", "授課簡報.pdf")
    output_dir = os.path.join(current_dir, "assets")
    convert_pdf_to_images(pdf_path, output_dir)
