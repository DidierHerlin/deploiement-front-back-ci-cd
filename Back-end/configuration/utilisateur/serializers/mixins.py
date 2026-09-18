class PhotoUrlMixin:

    def get_photo_url(self, obj):
        request = self.context.get("request")
        if obj.photo_profil:
            if request:
                return request.build_absolute_uri(obj.photo_profil.url)
            return obj.photo_profil.url
        return None
