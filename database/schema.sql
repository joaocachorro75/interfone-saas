-- Schema Interfone SaaS - MVP
-- Multi-tenant por subdominio

USE interfone_saas;

-- Tabela de Administradores SaaS
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Condominios (Tenants)
CREATE TABLE condominios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    admin_nome VARCHAR(100),
    admin_email VARCHAR(100),
    admin_telefone VARCHAR(20),
    
    -- Config SIP
    sip_domain VARCHAR(100),
    sip_port INT DEFAULT 5060,
    sip_webrtc_port INT DEFAULT 8089,
    
    -- Range de ramais (evita conflito entre condominios)
    ramal_base INT DEFAULT 1000,
    ramal_max INT DEFAULT 9999,
    
    -- Status
    status ENUM('ativo', 'inativo', 'suspenso') DEFAULT 'ativo',
    plano ENUM('basico', 'pro', 'enterprise') DEFAULT 'basico',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATE,
    
    INDEX idx_subdomain (subdomain),
    INDEX idx_status (status)
);

-- Torres do condominio
CREATE TABLE torres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    codigo VARCHAR(10),
    quantidade_andares INT,
    apartamentos_por_andar INT,
    
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE,
    INDEX idx_condo_torre (condominio_id, codigo)
);

-- Apartamentos
CREATE TABLE apartamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL,
    torre_id INT,
    numero VARCHAR(20) NOT NULL,
    andar INT,
    
    -- Morador
    morador_nome VARCHAR(100),
    morador_email VARCHAR(100),
    morador_telefone VARCHAR(20),
    
    -- Ramal SIP atribuido
    ramal_numero INT UNIQUE,
    ramal_senha VARCHAR(50),
    ramal_ativo BOOLEAN DEFAULT TRUE,
    
    -- Config
    chama_para_celular BOOLEAN DEFAULT TRUE,
    celular_sip VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE,
    FOREIGN KEY (torre_id) REFERENCES torres(id) ON DELETE SET NULL,
    INDEX idx_condo_apto (condominio_id, numero),
    INDEX idx_ramal (ramal_numero)
);

-- Usuarios do sistema (moradores, porteiros, admin)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL,
    apartamento_id INT,
    
    tipo ENUM('morador', 'porteiro', 'sindico', 'admin_condo') DEFAULT 'morador',
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    senha VARCHAR(255),
    telefone VARCHAR(20),
    
    -- Se for ramal
    ramal_numero INT,
    ramal_senha VARCHAR(50),
    
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_acesso DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE,
    FOREIGN KEY (apartamento_id) REFERENCES apartamentos(id) ON DELETE SET NULL,
    FOREIGN KEY (ramal_numero) REFERENCES apartamentos(ramal_numero),
    INDEX idx_login (condominio_id, email),
    INDEX idx_tipo (condominio_id, tipo)
);

-- Portarias
CREATE TABLE portarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    localizacao VARCHAR(100),
    
    -- Ramal SIP
    ramal_numero INT UNIQUE,
    ramal_senha VARCHAR(50),
    
    -- Configuracoes
    atende_24h BOOLEAN DEFAULT FALSE,
    telefone_backup VARCHAR(20),
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE,
    FOREIGN KEY (ramal_numero) REFERENCES apartamentos(ramal_numero)
);

-- Log de Chamadas
CREATE TABLE chamadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL,
    
    -- Quem ligou
    origem_ramal INT,
    origem_tipo ENUM('porteiro', 'apartamento', 'externo'),
    origem_numero VARCHAR(20),
    
    -- Para quem
    destino_ramal INT,
    destino_tipo ENUM('porteiro', 'apartamento', 'externo'),
    destino_numero VARCHAR(20),
    
    -- Status
    status ENUM('iniciada', 'atendida', 'ocupado', 'nao_atendeu', 'caixa_postal', 'erro') DEFAULT 'iniciada',
    duracao_segundos INT,
    
    -- Timestamps
    iniciada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atendida_em TIMESTAMP NULL,
    encerrada_em TIMESTAMP NULL,
    
    -- Recording (opcional)
    gravacao_url VARCHAR(255),
    
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE,
    INDEX idx_chamada_data (condominio_id, iniciada_em),
    INDEX idx_origem (origem_ramal, iniciada_em),
    INDEX idx_destino (destino_ramal, iniciada_em)
);

-- Configuracoes por condominio
CREATE TABLE configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL UNIQUE,
    
    -- Chamadas
    tempo_ring_segundos INT DEFAULT 30,
    encaminhar_para_portaria BOOLEAN DEFAULT TRUE,
    tempo_antes_portaria INT DEFAULT 20,
    
    -- Horario
    aceitar_chamadas_24h BOOLEAN DEFAULT TRUE,
    horario_inicio TIME DEFAULT '00:00:00',
    horario_fim TIME DEFAULT '23:59:59',
    
    -- Audio
    mensagem_boas_vindas VARCHAR(255),
    mensagem_nao_atende VARCHAR(255),
    mensagem_fora_horario VARCHAR(255),
    
    -- Integracao
    webhook_url VARCHAR(255),
    api_key VARCHAR(100),
    
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
);

-- Tokens de acesso (sessoes)
CREATE TABLE tokens_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    tipo ENUM('web', 'api', 'mobile') DEFAULT 'web',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Dados iniciais
INSERT INTO admins (nome, email, senha) VALUES 
('Admin Master', 'admin@interfone.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- senha: password

-- Criar banco para template FreePBX
CREATE DATABASE IF NOT EXISTS asterisk_template CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON asterisk_template.* TO 'saas_user'@'%';
FLUSH PRIVILEGES;
