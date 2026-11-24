-- AlterTable
ALTER TABLE `avaliacao` ADD COLUMN `privada` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `favorito` ADD COLUMN `recrutadorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `plano` ADD COLUMN `limiteComparar` INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE `recrutador` ADD COLUMN `notificacoesVistasEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `FiltroSalvo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recrutadorId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `filtros` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FiltroSalvo_recrutadorId_idx`(`recrutadorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId` INTEGER NOT NULL,
    `autorId` INTEGER NULL,
    `texto` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notificacao_empresaId_criadoEm_idx`(`empresaId`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comparacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId` INTEGER NOT NULL,
    `recrutadorId` INTEGER NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `metricas` JSON NOT NULL,
    `dados` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Comparacao_empresaId_criadoEm_idx`(`empresaId`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComentarioComparacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comparacaoId` INTEGER NOT NULL,
    `recrutadorId` INTEGER NULL,
    `texto` TEXT NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ComentarioComparacao_comparacaoId_idx`(`comparacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FiltroSalvo` ADD CONSTRAINT `FiltroSalvo_recrutadorId_fkey` FOREIGN KEY (`recrutadorId`) REFERENCES `Recrutador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `Recrutador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comparacao` ADD CONSTRAINT `Comparacao_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comparacao` ADD CONSTRAINT `Comparacao_recrutadorId_fkey` FOREIGN KEY (`recrutadorId`) REFERENCES `Recrutador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComentarioComparacao` ADD CONSTRAINT `ComentarioComparacao_comparacaoId_fkey` FOREIGN KEY (`comparacaoId`) REFERENCES `Comparacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComentarioComparacao` ADD CONSTRAINT `ComentarioComparacao_recrutadorId_fkey` FOREIGN KEY (`recrutadorId`) REFERENCES `Recrutador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorito` ADD CONSTRAINT `Favorito_recrutadorId_fkey` FOREIGN KEY (`recrutadorId`) REFERENCES `Recrutador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
