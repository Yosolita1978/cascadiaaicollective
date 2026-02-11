module.exports = function(eleventyConfig) {
  // Date filter for Nunjucks templates
  eleventyConfig.addFilter("date", function(value, format) {
    const date = new Date(value);
    const months = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    if (format === "%Y-%m-%d") {
      return date.toISOString().split("T")[0];
    }
    if (format === "%B %d, %Y") {
      return `${months[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, "0")}, ${date.getUTCFullYear()}`;
    }
    return date.toLocaleDateString("en-US");
  });

  // Copy these files as-is (no processing)
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
