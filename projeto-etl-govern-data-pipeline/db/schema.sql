CREATE TABLE IF NOT EXISTS compras_publicas (
    id SERIAL PRIMARY KEY,
    uf VARCHAR(2) NOT NULL,
    orgao VARCHAR(100),
    item VARCHAR(150),
    quantidade INTEGER CHECK (quantidade >= 0),
    valor_unitario NUMERIC(12,2) CHECK (valor_unitario >= 0),
    valor_total NUMERIC(14,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    data_insercao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);