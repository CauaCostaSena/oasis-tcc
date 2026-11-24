-- AlterTable
ALTER TABLE `Plano` ADD COLUMN `limiteRecrutadores` INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE `Avaliacao` ADD COLUMN `recrutadorId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Recrutador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `pinHash` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Recrutador_empresaId_idx`(`empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Recrutador` ADD CONSTRAINT `Recrutador_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_recrutadorId_fkey` FOREIGN KEY (`recrutadorId`) REFERENCES `Recrutador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
