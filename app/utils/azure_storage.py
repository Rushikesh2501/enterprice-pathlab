import os
from app.core.config import settings

def get_share_client():
    connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
    share_name = settings.AZURE_STORAGE_SHARE_NAME
    
    if not connection_string:
        # Fallback to local files
        local_dir = "./storage/reports"
        os.makedirs(local_dir, exist_ok=True)
        return None
    try:
        from azure.storage.fileshare import ShareServiceClient
        service_client = ShareServiceClient.from_connection_string(connection_string)
        share_client = service_client.get_share_client(share_name)
        # Try to create the share if it doesn't exist
        try:
            share_client.create_share()
        except Exception:
            pass
        return share_client
    except Exception as e:
        print(f"Failed to initialize Azure Share Client: {e}")
        return None

def upload_user_report(user_id: int, file_name: str, file_content: bytes) -> str:
    """
    Uploads file contents to the user-specific directory in the Azure File Share.
    Returns a unified resource URI.
    """
    share_client = get_share_client()
    if not share_client:
        # Local Fallback
        user_dir = f"./storage/reports/{user_id}"
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return f"local://{user_id}/{file_name}"
    
    try:
        # Check and create User Directory
        dir_client = share_client.get_directory_client(str(user_id))
        try:
            dir_client.create_directory()
        except Exception:
            pass
        
        # Create and upload file
        file_client = dir_client.get_file_client(file_name)
        file_client.upload_file(file_content)
        return f"azure://{user_id}/{file_name}"
    except Exception as e:
        print(f"Azure File Upload Error: {e}")
        # Fallback to local
        user_dir = f"./storage/reports/{user_id}"
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return f"local://{user_id}/{file_name}"

def download_user_report(file_path_uri: str) -> bytes:
    """
    Downloads file contents from either Azure File Share or local fallback storage.
    """
    if file_path_uri.startswith("local://"):
        parts = file_path_uri.replace("local://", "").split("/")
        user_id = parts[0]
        file_name = parts[1]
        local_path = f"./storage/reports/{user_id}/{file_name}"
        with open(local_path, "rb") as f:
            return f.read()
    
    elif file_path_uri.startswith("azure://"):
        parts = file_path_uri.replace("azure://", "").split("/")
        user_id = parts[0]
        file_name = parts[1]
        
        share_client = get_share_client()
        if not share_client:
            # Fallback locally if Azure isn't configured but URI exists
            local_path = f"./storage/reports/{user_id}/{file_name}"
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    return f.read()
            raise ValueError("Azure Storage Connection String not configured and local fallback not found")
        
        dir_client = share_client.get_directory_client(str(user_id))
        file_client = dir_client.get_file_client(file_name)
        download_stream = file_client.download_file()
        return download_stream.readall()
    
    else:
        # Direct file path fallback
        if os.path.exists(file_path_uri):
            with open(file_path_uri, "rb") as f:
                return f.read()
        raise ValueError(f"Unknown storage URI format: {file_path_uri}")
