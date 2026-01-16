from PIL import Image, ImageOps
import os

source_path = r"c:\Users\zackf\.gemini\antigravity\brain\44e919a9-d5d3-4c00-8fc1-3a4fbf75b67f\logo_concept_modern_1768542864660.png"
dest_path = r"c:\Users\zackf\Documents\OpenAI\harvest-app\public\assets\logo.png"

try:
    if not os.path.exists(source_path):
        print("Source file does not exist!")
    
    img = Image.open(source_path).convert("RGB")
    # Invert RGB: White (255,255,255) becomes Black (0,0,0). 
    # Bbox will find non-black pixels.
    inverted = ImageOps.invert(img)
    bbox = inverted.getbbox()
    
    if bbox:
        # Pad slightly
        padding = 20
        left, upper, right, lower = bbox
        left = max(0, left - padding)
        upper = max(0, upper - padding)
        right = min(img.size[0], right + padding)
        lower = min(img.size[1], lower + padding)
        
        cropped = img.crop((left, upper, right, lower))
        cropped.save(dest_path)
        print(f"Cropped to {bbox} and saved to {dest_path}")
    else:
        print("No content found (image is all white?)")
        img.save(dest_path)

except Exception as e:
    print(f"Error: {e}")
