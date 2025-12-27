"""
AWS S3 Service Module
Handles all S3 operations for image and audio uploads
"""
import boto3
from io import BytesIO
from backend.config import Config


# Initialize S3 client
s3_client = boto3.client(
    "s3",
    region_name=Config.AWS_REGION
)


def upload_file_to_s3(file_bytes, s3_key):
    """
    Upload file bytes to S3
    
    Args:
        file_bytes (bytes): File content as bytes
        s3_key (str): S3 object key (path)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        s3_client.upload_fileobj(BytesIO(file_bytes), Config.AWS_BUCKET, s3_key)
        return True
    except Exception as e:
        print(f"❌ S3 upload failed: {e}")
        return False


def download_file_from_s3(s3_key, local_path):
    """
    Download file from S3 to local path
    
    Args:
        s3_key (str): S3 object key
        local_path (str): Local file path to save
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        s3_client.download_file(Config.AWS_BUCKET, s3_key, local_path)
        return True
    except Exception as e:
        print(f"❌ S3 download failed: {e}")
        return False


def generate_presigned_url(s3_key, expiration=3600):
    """
    Generate presigned URL for S3 object
    
    Args:
        s3_key (str): S3 object key
        expiration (int): URL expiration time in seconds (default: 1 hour)
        
    Returns:
        str or None: Presigned URL or None if failed
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': Config.AWS_BUCKET, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        print(f"❌ Failed to generate presigned URL: {e}")
        return None


def upload_image_batch(image_data_list):
    """
    Upload multiple images to S3 in parallel
    
    Args:
        image_data_list (list): List of dicts with 'bytes', 'key', 'filename'
        
    Returns:
        list: List of successfully uploaded S3 keys
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    def upload_single(data):
        try:
            s3_client.upload_fileobj(BytesIO(data['bytes']), Config.AWS_BUCKET, data['key'])
            return {'success': True, 'key': data['key']}
        except Exception as e:
            return {'success': False, 'error': str(e), 'filename': data['filename']}
    
    uploaded_keys = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(upload_single, data) for data in image_data_list]
        
        for future in as_completed(futures):
            result = future.result()
            if result['success']:
                uploaded_keys.append(result['key'])
            else:
                print(f"❌ S3 upload failed for {result.get('filename')}: {result.get('error')}")
    
    return uploaded_keys


def get_s3_client():
    """
    Get the S3 client instance
    
    Returns:
        boto3.client: S3 client
    """
    return s3_client
