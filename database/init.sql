-- Inicialização do banco Interfone SaaS
-- Cria banco de dados e usuários

CREATE DATABASE IF NOT EXISTS interfone_saas 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Banco template para FreePBX master
CREATE DATABASE IF NOT EXISTS asterisk_template
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON interfone_saas.* TO 'saas_user'@'%';
GRANT ALL PRIVILEGES ON asterisk_template.* TO 'saas_user'@'%';

FLUSH PRIVILEGES;
