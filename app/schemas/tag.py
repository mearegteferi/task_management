from pydantic import BaseModel, ConfigDict

class TagBase(BaseModel):
    name: str
    color: str = "#FFFFFF"

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)