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
 * Returns the secure HTTPS URL of the uploaded file.
 * Supports image, raw (documents/drawings), and auto resource types.
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
        return upload(file, folder, "auto");
    }

    public String upload(MultipartFile file, String folder, String resourceType) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", resourceType
                )
        );
        return (String) result.get("secure_url");
    }

    /**
     * Upload any file as a raw resource (documents, drawings, PDFs, DWG, etc.).
     * Returns the full Cloudinary result map so the caller can extract
     * public_id, secure_url, bytes, format, etc.
     *
     * @param file   multipart file
     * @param folder e.g. "imms/documents"
     * @return full Cloudinary upload result map
     */
    public Map<?, ?> uploadRaw(MultipartFile file, String folder) throws IOException {
        return cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder",         folder,
                        "resource_type",  "raw",
                        "use_filename",   true,
                        "unique_filename", true
                )
        );
    }

    /**
     * Delete a Cloudinary asset by its public_id with an explicit resource_type.
     * Use this for documents/raw files where the resource_type is known.
     */
    public void deleteByPublicId(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType));
        } catch (Exception e) {
            System.err.println("Cloudinary delete warning: " + e.getMessage());
        }
    }

    /**
     * Delete an image by its public_id derived from the stored URL.
     * The public_id is the path including the folder prefix,
     * e.g. "imms/properties/prop_1_abc123"
     */
    public void delete(String secureUrl) {
        try {
            // Extract public_id from URL:
            // https://res.cloudinary.com/<cloud>/(image|raw|video)/upload/v12345/imms/properties/filename.jpg
            // → imms/properties/filename  (strip extension)
            String path = secureUrl.replaceAll("https://res.cloudinary.com/[^/]+/(image|raw|video)/upload/v[0-9]+/", "");
            String publicId = path.replaceAll("\\.[^.]+$", ""); // strip extension
            
            // For 'raw' files (like PDFs often are in auto), resource_type might need to be specified in destroy
            // But Cloudinary's default is 'image'. By default it tries to delete an image. 
            // Better to specify resource_type auto or raw if possible.
            // But we can just try both image and raw explicitly because destroy() only accepts string options?
            // "destroy" actually lets you pass resource_type:
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
            // (Note: we also keep the extension for raw files according to some Cloudinary docs, 
            // but let's just attempt it with extension too)
            cloudinary.uploader().destroy(path, ObjectUtils.asMap("resource_type", "raw"));
        } catch (Exception e) {
            // log but never fail a delete request because of CDN issues
            System.err.println("Cloudinary delete warning: " + e.getMessage());
        }
    }
}
