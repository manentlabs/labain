-- AlterTable
ALTER TABLE `user` ADD COLUMN `plan` VARCHAR(191) NOT NULL DEFAULT 'FREE',
    ADD COLUMN `planExpiry` DATETIME(3) NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Usage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `feature` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    INDEX `Usage_userId_date_idx`(`userId`, `date`),
    UNIQUE INDEX `Usage_userId_feature_date_key`(`userId`, `feature`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usage` ADD CONSTRAINT `Usage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
