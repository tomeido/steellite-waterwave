import os
import re
import shutil
from PIL import Image

# Configuration
IMAGE_DIR = 'images'
DATA_DIRS = [
    {'path': 'data/TBF (1)', 'label': 'TBF'},
    {'path': 'data/이케부크로 현장 사진 첨부', 'label': '이케부크로 프로젝트(Ikebukuro Project)'}
]
LOCATION_DATA_FILE = 'location_data.js'
MAX_SIZE = (1920, 1920)
QUALITY = 85

def get_next_project_id(image_dir):
    max_id = 0
    pattern = re.compile(r'project-(\d+)\.(jpg|png|jpeg)', re.IGNORECASE)
    if not os.path.exists(image_dir):
        return 1
    
    for filename in os.listdir(image_dir):
        match = pattern.match(filename)
        if match:
            num = int(match.group(1))
            if num > max_id:
                max_id = num
    return max_id + 1

def process_images():
    current_id = get_next_project_id(IMAGE_DIR)
    new_entries = {}
    
    print(f"Starting Project ID: {current_id}")

    for entry in DATA_DIRS:
        src_dir = entry['path']
        label = entry['label']
        
        if not os.path.exists(src_dir):
            print(f"Directory not found: {src_dir}")
            continue
            
        print(f"Processing directory: {src_dir} with label: {label}")
        
        files = sorted(os.listdir(src_dir))
        for filename in files:
            lower_name = filename.lower()
            if not (lower_name.endswith('.jpg') or lower_name.endswith('.jpeg') or lower_name.endswith('.png')):
                continue
                
            src_path = os.path.join(src_dir, filename)
            new_filename = f"project-{current_id}.jpg"
            dst_path = os.path.join(IMAGE_DIR, new_filename)
            
            try:
                with Image.open(src_path) as img:
                    # Convert to RGB if necessary
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    
                    # Resize
                    img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
                    
                    # Save
                    img.save(dst_path, 'JPEG', quality=QUALITY)
                    print(f"Saved {dst_path}")
                    
                new_entries[new_filename] = label
                current_id += 1
                
            except Exception as e:
                print(f"Error processing {src_path}: {e}")

    return new_entries

def update_location_data(new_entries):
    with open(LOCATION_DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find the end of the object
    # looking for the last closing brace before the semi-colon
    # simplistic approach assuming the structure matches the view we had
    
    match = re.search(r'(};\s*$)', content)
    if not match:
        print("Could not find closing brace in location_data.js")
        return

    insertion_point = content.rfind('};')
    
    new_data_str = ""
    for filename, label in new_entries.items():
        new_data_str += f'  "{filename}": "{label}",\n'
    
    updated_content = content[:insertion_point] + new_data_str + content[insertion_point:]
    
    with open(LOCATION_DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"Updated {LOCATION_DATA_FILE} with {len(new_entries)} new entries.")

if __name__ == "__main__":
    new_entries = process_images()
    if new_entries:
        update_location_data(new_entries)
    else:
        print("No new images processed.")
