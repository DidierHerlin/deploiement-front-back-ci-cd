import base64
import uuid
import io
from PIL import Image
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

def save_base64_photos(photos_list):
    new_photos = []
    for photo in photos_list:
        if photo.startswith('data:image'):
            try:
                format, imgstr = photo.split(';base64,') 
                ext = format.split('/')[-1].split(';')[0]
                if ext.lower() == 'jpeg':
                    ext = 'jpg'
                
                # Decode base64
                img_data = base64.b64decode(imgstr)
                
                # Resize and compress using Pillow
                img = Image.open(io.BytesIO(img_data))
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Max dimension 1024px for thumbnails/viewing
                img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=75, optimize=True)
                output.seek(0)
                
                file_name = f"biens/{uuid.uuid4()}.jpg"
                data = ContentFile(output.read(), name=file_name)
                saved_path = default_storage.save(file_name, data)
                new_photos.append(default_storage.url(saved_path))
            except Exception as e:
                print(f"Error decoding base64 image: {e}")
                new_photos.append(photo) # fallback
        else:
            new_photos.append(photo)
    return new_photos
