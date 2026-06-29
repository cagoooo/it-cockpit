# -*- coding: utf-8 -*-
"""
簡報 PDF 轉 1920x1080 JPG 腳本
"""
import fitz
from PIL import Image
import os
import sys
import io

# 設定 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def convert_pdf(pdf_path, output_dir):
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return
        
    doc = fitz.open(pdf_path)
    print(f"Opened PDF: {pdf_path} with {len(doc)} pages.")
    
    for i, page in enumerate(doc):
        # 1. 以 300 DPI 渲染為 PNG
        zoom = 300 / 72
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix)
        
        png_name = f"slide_{i+1:02d}.png"
        png_path = os.path.join(output_dir, png_name)
        pix.save(png_path)
        
        # 2. 轉為 1920x1080 JPG
        jpg_name = f"slide_{i+1:02d}.jpg"
        jpg_path = os.path.join(output_dir, jpg_name)
        
        with Image.open(png_path) as img:
            img = img.convert('RGB')
            # 依 1920x1080 重設大小
            img = img.resize((1920, 1080), Image.Resampling.LANCZOS)
            img.save(jpg_path, 'JPEG', quality=85)
            
        # 3. 移除原始 PNG 節省空間
        os.remove(png_path)
        print(f"Processed slide {i+1:02d} -> {jpg_name}")
        
    doc.close()
    print("All slides processed successfully.")

if __name__ == '__main__':
    unit_dir = r"c:\Users\smes\Desktop\Cowork\2-教學備課\NBLM\it-cockpit\tinkercad-3d-print"
    pdf = os.path.join(unit_dir, "assets", "授課簡報.pdf")
    assets = os.path.join(unit_dir, "assets")
    convert_pdf(pdf, assets)
