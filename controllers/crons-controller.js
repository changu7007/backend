import { CronJob } from "cron";
import generateSitemaps from "../utils/sitemapUtil.js";
// import generateSitemaps from './seo-controller.js'; // Adjust the path as necessary

const job = new CronJob(
  "0 0,1 * * *",
  async () => {
    try {
      await generateSitemaps();
      console.log("Sitemaps generated successfully.");
    } catch (error) {
      console.error("Error when generating sitemaps: ", error);
    }
  },
  null,
  true,
  null,
  null,
  true
);

job.start(); // Start the Cron job
