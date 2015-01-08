require('ggplot2')
require("dplyr")
require("lubridate")
require("stringr")

#http://mefiwiki.com/wiki/Infodump
#http://stuff.metafilter.com/infodump/

# needs these two files to function. one is the data dump of new posts. 
# The other is the category mapppings from the wiki.
# I've included the category mappings because its tiny, but not the 
# posts dump - thats too big for me to include here.

askmefi <- read.table("./postdata_askme.txt", header = TRUE, sep = "\t", skip = 1, fill = TRUE)
cats <- read.table("./askmefi_cats.txt", header = TRUE, sep = "\t")

askmefi <- merge(askmefi, cats, by.x = c("category"), by.y = c("CatID"))

# some of the datestamps has a double space in them...
clean_stamps <- gsub("  ", " ", askmefi$datestamp)
dates <- str_split_fixed(clean_stamps, " ", 4)
dates_df <- data.frame(dates)
head(dates_df)
colnames(dates_df) <- c("month",  "day", "year", "time")
dates_df$mon_year <- paste(dates_df$month, dates_df$year, sep = "-")

askmefi_dates <- cbind(askmefi, dates_df)
askmefi_months <- summarise(group_by(askmefi_dates, mon_year, Description), n = n())

colnames(askmefi_months) <- c('mon_year', 'category', 'n')
# write out the month level data - in case you want to see that
write.table(askmefi_months, file = "./askmefi_category_month.tsv", row.names = FALSE, col.names = TRUE, sep = "\t")

askmefi_years <- summarise(group_by(askmefi_dates, year, Description), n = n())
askmefi_years <- filter(askmefi_years, year != "2003")
colnames(askmefi_years) <- c('year', 'category', 'n')

# write out year data
write.table(askmefi_years, file = "./askmefi_category_year.tsv", row.names = FALSE, col.names = TRUE, sep = "\t")

