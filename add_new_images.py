
import os
import shutil
import re
import json
from PIL import Image, ImageOps

def get_next_project_number(images_dir):
    max_num = 0
    pattern = re.compile(r'project-(\d+)\.jpg')
    for f in os.listdir(images_dir):
        match = pattern.match(f)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    return max_num + 1

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
        print(f"Error optimizing image: {e}")
        return False

def main():
    base_dir = r"c:\Users\user\.gemini\antigravity\scratch\steellite-waterwave"
    images_dir = os.path.join(base_dir, "images")
    
    new_images = [
        r"C:/Users/user/.gemini/antigravity/brain/ff155c9d-6cdd-4020-a6ad-ebc44d680880/uploaded_image_0_1768875420894.jpg",
        r"C:/Users/user/.gemini/antigravity/brain/ff155c9d-6cdd-4020-a6ad-ebc44d680880/uploaded_image_1_1768875420894.jpg"
    ]
    
    # Inferred names (First one has text 't'order', second is generic office)
    new_names = [
        "티오더(t'order) 본사",
        "프리미엄 오피스 미팅룸"
    ]
    
    start_num = get_next_project_number(images_dir)
    added_files = []
    
    # 1. Optimize and Save
    for i, src in enumerate(new_images):
        current_num = start_num + i
        dst_filename = f"project-{current_num}.jpg"
        dst_path = os.path.join(images_dir, dst_filename)
        
        if optimize_image(src, dst_path):
            added_files.append((dst_filename, new_names[i]))
            
    if not added_files:
        print("No files added.")
        return

    # 2. Update location_data.js
    loc_path = os.path.join(base_dir, "location_data.js")
    with open(loc_path, 'r', encoding='utf-8') as f:
        # Assuming format: const imageLocations = { ... };
        content = f.read()
        start_brace = content.find('{')
        end_brace = content.rfind('}')
        if start_brace != -1 and end_brace != -1:
            json_str = content[start_brace:end_brace+1]
            data = json.loads(json_str)
            
            for fname, loc_name in added_files:
                data[fname] = loc_name
                
            # Rewrite
            new_json = json.dumps(data, ensure_ascii=False, indent=2)
            new_content = f"const imageLocations = {new_json};\n"
            
    with open(loc_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        print("Updated location_data.js")

    # 3. Update script.js count
    script_path = os.path.join(base_dir, "script.js")
    with open(script_path, 'r', encoding='utf-8') as f:
        script_content = f.read()
        
    final_count = start_num + len(added_files) - 1 # because start_num is the first new one
    # Current total is actually final_count (last index)
    
    new_script_content = re.sub(r'const TOTAL_IMAGES = \d+;', f'const TOTAL_IMAGES = {final_count};', script_content)
    
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(new_script_content)
        print(f"Updated script.js TOTAL_IMAGES to {final_count}")

if __name__ == "__main__":
    main()
