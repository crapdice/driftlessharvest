from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, (255, 255, 255, 255))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

source_path = r"c:\Users\zackf\.gemini\antigravity\brain\44e919a9-d5d3-4c00-8fc1-3a4fbf75b67f\logo_concept_modern_1768542864660.png"
dest_path = r"c:\Users\zackf\Documents\OpenAI\harvest-app\public\assets\logo.png"

try:
    img = Image.open(source_path).convert("RGBA")
    # Also trim based on white color being background
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    
    if bbox:
        # Add a small padding
        padding = 10
        left, upper, right, lower = bbox
        left = max(0, left - padding)
        upper = max(0, upper - padding)
        right = min(img.size[0], right + padding)
        lower = min(img.size[1], lower + padding)
        cropped = img.crop((left, upper, right, lower))
        cropped.save(dest_path)
        print(f"Successfully cropped and saved to {dest_path}")
    else:
        # If no bbox found (empty image?), just save original
        img.save(dest_path)
        print("No content found to crop, saved original")

except Exception as e:
    print(f"Error: {e}")
