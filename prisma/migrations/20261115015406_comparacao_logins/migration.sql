/*
  Warnings:

  - Added the required column `logins` to the `Comparacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `comparacao` ADD COLUMN `logins` VARCHAR(191) NOT NULL;
