from PIL import Image, ImageOps
import os

source_path = r"c:\Users\zackf\.gemini\antigravity\brain\44e919a9-d5d3-4c00-8fc1-3a4fbf75b67f\logo_concept_modern_1768542864660.png"
dest_path = r"c:\Users\zackf\Documents\OpenAI\harvest-app\public\assets\logo.png"

try:
    img = Image.open(source_path).convert("RGB")
    
    # Thresholding to handle off-white background
    gray = img.convert("L")
    # Anything > 240 is treated as background (white)
    # So we want to find pixels < 240
    
    # Let's verify min value
    # print(f"Min/Max gray: {gray.getextrema()}")
    
    # Create mask: 255 if pixel < 240 (content), 0 if pixel >= 240 (background)
    mask = gray.point(lambda p: 255 if p < 250 else 0)
    
    bbox = mask.getbbox()
        
    if bbox:
        # Pad slightly
        padding = 10
        left, upper, right, lower = bbox
        left = max(0, left - padding)
        upper = max(0, upper - padding)
        right = min(img.size[0], right + padding)
        lower = min(img.size[1], lower + padding)
        
        cropped = img.crop((left, upper, right, lower))
        cropped.save(dest_path)
        print(f"Cropped to {bbox} (with padding) and saved.")
    else:
        print("No content found even with threshold!")
        img.save(dest_path)

except Exception as e:
    print(f"Error: {e}")
