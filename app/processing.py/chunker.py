class TextChunker:
    def __init__(self, *, chunk_size: int = 1000, chunk_overlap:int = 200):
        if chunk_overlap >= chunk_size:
            raise ValueError(
                "chunk overlap must be smaller than chunk_size"
            )
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

chunker = TextChunker()