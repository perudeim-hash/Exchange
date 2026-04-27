import requests
import pandas as pd
from datetime import date, timedelta

API_KEY = JXQFY3RTLDZPFA4QMNSZ
STAT_CODE = "731Y001"
CYCLE = "D"
ITEM_CODE_USD = "0000001"

end_date = date.today()
start_date = end_date - timedelta(days=365)

start = start_date.strftime("%Y%m%d")
end = end_date.strftime("%Y%m%d")

url = (
    f"https://ecos.bok.or.kr/api/StatisticSearch/"
    f"{API_KEY}/json/kr/1/1000/"
    f"{STAT_CODE}/{CYCLE}/{start}/{end}/{ITEM_CODE_USD}"
)

response = requests.get(url)
data = response.json()

rows = data["StatisticSearch"]["row"]

result = []

for row in rows:
    result.append({
        "date": row["TIME"],
        "currency": "USD",
        "rate": float(row["DATA_VALUE"])
    })

df = pd.DataFrame(result)

df["date"] = pd.to_datetime(df["date"], format="%Y%m%d")
df = df.sort_values("date")

df.to_excel("usd_krw_1year.xlsx", index=False)

print("완료: usd_krw_1year.xlsx 생성됨")
print(df.head())
print(df.tail())