from django.core.management.base import BaseCommand
from bien.models import Bien
from bien.utils import save_base64_photos

class Command(BaseCommand):
    help = 'Convert base64 photos to URLs'

    def handle(self, *args, **options):
        biens = Bien.objects.all()
        count = 0
        for bien in biens:
            if bien.photos:
                has_base64 = any(p.startswith('data:image') for p in bien.photos)
                if has_base64:
                    new_photos = save_base64_photos(bien.photos)
                    bien.photos = new_photos
                    bien.save(update_fields=['photos'])
                    count += 1
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {count} biens.'))
