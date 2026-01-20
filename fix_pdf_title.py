
import os
from pypdf import PdfReader, PdfWriter

def fix_pdf_metadata(filename, new_title):
    try:
        reader = PdfReader(filename)
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
            
        # Update metadata
        # Current metadata
        current_metadata = reader.metadata
        print(f"Current Title of {os.path.basename(filename)}: {current_metadata.title}")
        
        # New metadata
        writer.add_metadata(current_metadata)
        writer.add_metadata({"/Title": new_title})
        
        # Save
        with open(filename, "wb") as f_out:
            writer.write(f_out)
            
        print(f"Updated Title to: {new_title}")
        
    except Exception as e:
        print(f"Error processing {filename}: {e}")

base_dir = r"c:\Users\user\.gemini\antigravity\scratch\steellite-waterwave\data"
target_file = os.path.join(base_dir, "워터웨이브 600Φ 샘플사진-200916.pdf")

fix_pdf_metadata(target_file, "워터웨이브 샘플")
