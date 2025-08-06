import csv
import re
import requests
from bs4 import BeautifulSoup
import pandas as pd

urls = [
    "https://series.naver.com/comic/detail.series?productNo=6393990",
    "https://series.naver.com/comic/detail.series?productNo=9478408",
    "https://series.naver.com/comic/detail.series?productNo=6362438",
    "https://page.kakao.com/content/53764524",
    "https://page.kakao.com/content/58439503?orderby=asc",
    "https://page.kakao.com/content/56453386",
    "https://page.kakao.com/content/67242927"
]

def parse_count(text):
    if "만" in text:
        return int(float(text.replace("만", "")) * 10000)
    elif "천" in text:
        return int(float(text.replace("천", "")) * 1000)
    return int(text.replace(",", "").strip())

def scrape_naver(url):
    r = requests.get(url)
    soup = BeautifulSoup(r.text, "html.parser")
    title = soup.select_one("h3.TitleHeader__title").text.strip() if soup.select_one("h3.TitleHeader__title") else ''
    likes_elem = soup.select_one("span.Info__like span")
    likes = parse_count(likes_elem.text.strip()) if likes_elem else ''
    status = "완결" if "완결" in r.text else "연재중"
    return [url, title, "", likes, status]

def scrape_kakao(url):
    r = requests.get(url)
    soup = BeautifulSoup(r.text, "html.parser")
    title = soup.select_one("h2").text.strip() if soup.select_one("h2") else ''
    all_text = soup.get_text()
    views_match = re.search(r'([0-9.]+만)', all_text)
    likes_match = re.search(r'평점\s*([0-9.]+)', all_text)
    views = parse_count(views_match.group(1)) if views_match else ''
    likes = float(likes_match.group(1)) if likes_match else ''
    status = "완결" if "완결" in all_text else "연재중"
    return [url, title, views, likes, status]

data = []
for url in urls:
    if "naver.com" in url:
        data.append(scrape_naver(url))
    elif "kakao.com" in url:
        data.append(scrape_kakao(url))

# Save to CSV
df = pd.DataFrame(data, columns=["title_url", "title_name_kr", "views", "likes", "completed"])
df.to_csv("webtoon_metadata.csv", index=False, encoding="utf-8-sig")
print(df)

