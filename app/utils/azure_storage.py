import os
from app.core.config import settings

def get_blob_service_client():
    connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
    if not connection_string:
        return None
    try:
        from azure.storage.blob import BlobServiceClient
        service_client = BlobServiceClient.from_connection_string(connection_string)
        return service_client
    except Exception as e:
        print(f"Failed to initialize Azure Blob Service Client: {e}")
        return None

def get_container_client(service_client):
    container_name = settings.AZURE_STORAGE_CONTAINER_NAME
    container_client = service_client.get_container_client(container_name)
    try:
        # Try to create the container if it doesn't exist
        container_client.create_container()
    except Exception:
        pass
    return container_client

def upload_user_report(user_id: int, file_name: str, file_content: bytes) -> str:
    """
    Uploads file contents to the user-specific directory in the Azure Blob Storage container.
    Returns a unified resource URI (e.g. azure://user_id/file_name).
    """
    service_client = get_blob_service_client()
    if not service_client:
        # Local Fallback
        user_dir = f"./storage/reports/{user_id}"
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return f"local://{user_id}/{file_name}"
    
    try:
        container_client = get_container_client(service_client)
        # In Blob storage, virtual directories are created automatically by using a '/' delimiter in the blob name
        blob_path = f"{user_id}/{file_name}"
        blob_client = container_client.get_blob_client(blob_path)
        
        # Upload the blob (overwrite if exists)
        blob_client.upload_blob(file_content, overwrite=True)
        return f"azure://{user_id}/{file_name}"
    except Exception as e:
        print(f"Azure Blob Upload Error: {e}")
        # Fallback to local
        user_dir = f"./storage/reports/{user_id}"
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return f"local://{user_id}/{file_name}"

def download_user_report(file_path_uri: str) -> bytes:
    """
    Downloads file contents from either Azure Blob Storage or local fallback storage.
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
        
        service_client = get_blob_service_client()
        if not service_client:
            # Fallback locally if Azure isn't configured but URI exists
            local_path = f"./storage/reports/{user_id}/{file_name}"
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    return f.read()
            raise ValueError("Azure Storage Connection String not configured and local fallback not found")
        
        container_client = get_container_client(service_client)
        blob_path = f"{user_id}/{file_name}"
        blob_client = container_client.get_blob_client(blob_path)
        
        download_stream = blob_client.download_blob()
        return download_stream.readall()
    
    else:
        # Direct file path fallback
        if os.path.exists(file_path_uri):
            with open(file_path_uri, "rb") as f:
                return f.read()
        raise ValueError(f"Unknown storage URI format: {file_path_uri}")
