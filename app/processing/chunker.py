class TextChunker:
    def __init__(self, *, chunk_size: int = 1000, chunk_overlap:int = 200):
        if chunk_overlap >= chunk_size:
            raise ValueError(
                "chunk overlap must be smaller than chunk_size"
            )
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split(self, text:str)-> list[str]:
        if not text: 
            return []

        chunks = []
        start = 0
        while(start) < len(text):
            end = start + self.chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += self.chunk_size - self.chunk_overlap
        return chunks

chunker = TextChunker()

