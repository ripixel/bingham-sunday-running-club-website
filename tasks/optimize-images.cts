/**
 * optimize-images.cts
 *
 * Task to generate optimized OG image variants for social sharing.
 * Resizes large phone photos to 1200×630 JPEG at 80% quality.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { TaskDef } from 'skier/dist/types';

const sharp = require('sharp');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_QUALITY = 80;
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const createOptimizeImagesTask = (): TaskDef<{}, void> => ({
    name: 'optimize-images',
    title: 'Generate optimized OG images for social sharing',
    config: {},
    run: async (_, { logger }) => {
        const projectRoot = process.cwd();
        const racesDir = path.join(projectRoot, 'public/images/races');
        const ogDir = path.join(racesDir, 'og');

        if (!fs.existsSync(racesDir)) {
            logger.info('No races image directory found, skipping OG image generation');
            return;
        }

        // Ensure output directory exists
        fs.mkdirSync(ogDir, { recursive: true });

        const files = fs.readdirSync(racesDir).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return SUPPORTED_EXTENSIONS.includes(ext) && !fs.statSync(path.join(racesDir, f)).isDirectory();
        });

        if (files.length === 0) {
            logger.info('No race images found to optimize');
            return;
        }

        let processedCount = 0;

        for (const file of files) {
            const inputPath = path.join(racesDir, file);
            // Always output as .jpg
            const outputName = path.basename(file, path.extname(file)) + '.jpg';
            const outputPath = path.join(ogDir, outputName);

            try {
                await sharp(inputPath)
                    .resize(OG_WIDTH, OG_HEIGHT, {
                        fit: 'cover',
                        position: 'centre',
                    })
                    .jpeg({ quality: OG_QUALITY })
                    .toFile(outputPath);

                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.statSync(outputPath).size;
                const reduction = Math.round((1 - outputSize / inputSize) * 100);

                logger.info(
                    `Optimized: ${file} → og/${outputName} (${formatBytes(inputSize)} → ${formatBytes(outputSize)}, ${reduction}% smaller)`
                );
                processedCount++;
            } catch (err) {
                logger.error(`Failed to optimize ${file}: ${(err as Error).message}`);
            }
        }

        // Also process any images in the root images directory that are used as mainPhoto
        const imagesDir = path.join(projectRoot, 'public/images');
        const rootOgDir = path.join(imagesDir, 'og');
        fs.mkdirSync(rootOgDir, { recursive: true });

        const rootImages = fs.readdirSync(imagesDir).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return SUPPORTED_EXTENSIONS.includes(ext) && !fs.statSync(path.join(imagesDir, f)).isDirectory();
        });

        for (const file of rootImages) {
            const inputPath = path.join(imagesDir, file);
            const outputName = path.basename(file, path.extname(file)) + '.jpg';
            const outputPath = path.join(rootOgDir, outputName);

            try {
                await sharp(inputPath)
                    .resize(OG_WIDTH, OG_HEIGHT, {
                        fit: 'cover',
                        position: 'centre',
                    })
                    .jpeg({ quality: OG_QUALITY })
                    .toFile(outputPath);

                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.statSync(outputPath).size;
                const reduction = Math.round((1 - outputSize / inputSize) * 100);

                logger.info(
                    `Optimized: ${file} → og/${outputName} (${formatBytes(inputSize)} → ${formatBytes(outputSize)}, ${reduction}% smaller)`
                );
                processedCount++;
            } catch (err) {
                logger.error(`Failed to optimize ${file}: ${(err as Error).message}`);
            }
        }

        logger.info(`OG image optimization complete. Processed ${processedCount} images.`);
    },
});

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}
