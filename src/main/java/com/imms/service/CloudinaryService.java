package com.imms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Thin wrapper around the Cloudinary SDK.
 * Returns the secure HTTPS URL of the uploaded image.
 */
@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload a file to the given folder on Cloudinary.
     *
     * @param file   multipart file from the HTTP request
     * @param folder e.g. "imms/properties" or "imms/assets"
     * @return secure HTTPS URL (e.g. https://res.cloudinary.com/di6r3oggs/...)
     */
    public String upload(MultipartFile file, String folder) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "image"
                )
        );
        return (String) result.get("secure_url");
    }

    /**
     * Delete an image by its public_id derived from the stored URL.
     * The public_id is the path including the folder prefix,
     * e.g. "imms/properties/prop_1_abc123"
     */
    public void delete(String secureUrl) {
        try {
            // Extract public_id from URL:
            // https://res.cloudinary.com/<cloud>/image/upload/v12345/imms/properties/filename.jpg
            // → imms/properties/filename  (strip extension)
            String path = secureUrl.replaceAll("https://res.cloudinary.com/[^/]+/image/upload/v[0-9]+/", "");
            String publicId = path.replaceAll("\\.[^.]+$", ""); // strip extension
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            // log but never fail a delete request because of CDN issues
            System.err.println("Cloudinary delete warning: " + e.getMessage());
        }
    }
}
