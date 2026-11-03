-- AlterTable
ALTER TABLE `Busca` ADD COLUMN `chave` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Busca_chave_key` ON `Busca`(`chave`);
