-- AlterTable
ALTER TABLE `favorito` ADD COLUMN `pastaId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Pasta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Pasta_empresaId_idx`(`empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pasta` ADD CONSTRAINT `Pasta_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorito` ADD CONSTRAINT `Favorito_pastaId_fkey` FOREIGN KEY (`pastaId`) REFERENCES `Pasta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
