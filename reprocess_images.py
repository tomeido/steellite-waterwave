import os
import shutil
import re
import json
from PIL import Image, ImageOps

def optimize_image(src_path, dst_path):
    print(f"Optimizing {src_path} -> {dst_path}")
    try:
        with Image.open(src_path) as img:
            img = ImageOps.exif_transpose(img)
            
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            max_dim = 1600
            if max(img.size) > max_dim:
                ratio = max_dim / max(img.size)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                
            img.save(dst_path, "JPEG", quality=85, optimize=True)
            return True
    except Exception as e:
        print(f"Error optimizing image {src_path}: {e}")
        return False

def main():
    base_dir = r"c:\Users\user\.gemini\antigravity\scratch\steellite-waterwave"
    images_dir = os.path.join(base_dir, "images")
    data_dir = os.path.join(base_dir, "data")
    
    # Sources
    tbf_dir = os.path.join(data_dir, "TBF (1)")
    ikebukuro_dir = os.path.join(data_dir, "이케부크로 현장 사진 첨부")
    
    # 1. Backup
    shutil.copy2(os.path.join(base_dir, "location_data.js"), os.path.join(base_dir, "location_data.js.bak_reprocess"))
    shutil.copy2(os.path.join(base_dir, "script.js"), os.path.join(base_dir, "script.js.bak_reprocess"))
    print("Backed up JS files.")

    # 2. Delete range 345 - 400 (safe upper bound)
    for i in range(345, 401):
        f = os.path.join(images_dir, f"project-{i}.jpg")
        if os.path.exists(f):
            os.remove(f)
            print(f"Deleted {f}")
            
    # 3. Collect new images
    # TBF
    tbf_files = sorted([os.path.join(tbf_dir, f) for f in os.listdir(tbf_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    # Ikebukuro - exclude zip
    ike_files = sorted([os.path.join(ikebukuro_dir, f) for f in os.listdir(ikebukuro_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    
    all_new_images = []
    # Add TBF (8 images)
    for f in tbf_files:
        all_new_images.append((f, "TBF"))
        
    # Add Ikebukuro (10 images)
    for f in ike_files:
        all_new_images.append((f, "이케부크로 프로젝트(Ikebukuro Project)"))
        
    start_id = 345
    added_entries = {}
    
    # 4. Process
    for i, (src, loc_name) in enumerate(all_new_images):
        current_id = start_id + i
        dst_name = f"project-{current_id}.jpg"
        dst_path = os.path.join(images_dir, dst_name)
        
        if optimize_image(src, dst_path):
            added_entries[dst_name] = loc_name
            
    final_count = start_id + len(added_files) - 1 if 'added_files' in locals() else start_id + len(added_entries) - 1
    
    # 5. Update location_data.js
    loc_path = os.path.join(base_dir, "location_data.js")
    with open(loc_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract JSON part
    start_brace = content.find('{')
    end_brace = content.rfind('}')
    if start_brace != -1 and end_brace != -1:
        json_str = content[start_brace:end_brace+1]
        # Allow trailing commas for JS object loose parsing if needed, but standard json.loads needs strict
        # Simple regex to remove trailing comma if present before closing brace
        json_str = re.sub(r',(\s*})', r'\1', json_str)
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            # Fallback: manual parsing or just append? 
            # Given the file structure is simple, let's just create a valid dict from previous known state + regex
            print("Warning: Could not parse location_data.js strict JSON. Attempting manual fix.")
            # We will rely on the fact we have a backup and just reconstruct the known good part + new
            # Actually, let's use the backup we just made if parsing fails? 
            # Or better, just strip the old range keys if they exist in the raw string and append new
            pass 
            # Re-read for safety if we want to modify text directly
            
    # Robust approach: Read file, strip existing 345+ entries, append new ones manually
    new_lines = []
    with open(loc_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        if "};" in line:
            break
        # Check if line defines a project ID >= 345
        match = re.search(r'"project-(\d+)\.jpg"', line)
        if match:
            pid = int(match.group(1))
            if pid >= 345:
                continue # Skip old
        new_lines.append(line)
        
    # Remove trailing comma on last item if necessary? JS objects allow it usually, strictly JSON doesn't.
    # But this is a JS file.
    
    # Append new entries
    for fname, loc in added_entries.items():
        new_lines.append(f'  "{fname}": "{loc}",\n')
        
    new_lines.append("};\n")
    
    with open(loc_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Updated location_data.js")

    # 6. Update script.js
    script_path = os.path.join(base_dir, "script.js")
    with open(script_path, 'r', encoding='utf-8') as f:
        s_content = f.read()
        
    new_s_content = re.sub(r'const TOTAL_IMAGES = \d+;', f'const TOTAL_IMAGES = {final_count};', s_content)
    
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(new_s_content)
    print(f"Updated script.js to TOTAL_IMAGES = {final_count}")

if __name__ == "__main__":
    main()
