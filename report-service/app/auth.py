from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os

# PENTING: Secret key ini harus SAMA dengan yang ada di Authentication Service
SECRET_KEY = os.getenv("SECRET_KEY", "5400bcc59d07b2923ae210d8c85873eb4cce1fc17dfdec946f900394bec13102")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id") or payload.get("sub")
        role = payload.get("role")
        department = payload.get("department") # Penting untuk Admin

        if user_id is None or role is None:
            raise credentials_exception
            
        return {
            "id": str(user_id),
            "role": role,
            "department": department
        }
    except JWTError:
        raise credentials_exception