from tinydb import TinyDB, Query

db = TinyDB("plates.json")
plates_table = db.table("plates")

