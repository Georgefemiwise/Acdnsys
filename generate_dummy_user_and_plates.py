import json
import time
import datetime
from random import choice, randint

names = [
    "George",
    "Joub",
    "John",
    "Doe",
    "Kim",
    "Elit",
    "Moses",
    "Kate",
    "Wise",
    "Ben",
    "Rubben",
]

makes = ["Toyota", "Honda", "Nissan", "BMW", "Ford"]
models = ["Corolla", "Civic", "Sentra", "Corp", "F150"]
colors = ["Silver", "Blue", "White", "Orange", "Pink"]

# Load existing data
try:
    with open("acdnsys.json", "r") as file:
        data = json.load(file)
except (FileNotFoundError, json.JSONDecodeError):
    data = {"users": {}, "plates": {}}

users = data.get("users", {})
plates = data.get("plates", {})

# --- Generate new users ---
for i in range(20):  # generate 2 users
    user_id = randint(10000, 99999)  # random ID like your example
    number = str(randint(200000000, 599999999))
    phone = f"+233{number}"

    name = f"{choice(names)} {choice(names)}"
    now = datetime.datetime.now().isoformat()

    user = {
        "id": user_id,
        "name": name,
        "phone": phone,
        "email": f"{name.replace(' ', '').lower()}@example.com",
        "address": choice(["Accra, Ghana", "Kumasi, Ghana", "Sekondi"]),
        "emergency_contact": f"+233{randint(200000000, 599999999)}",
        "notes": choice(["VIP Customer", "Regular Customer", ""]),
        "created_at": now,
        "updated_at": now,
        "is_active": choice([True, False]),
    }

    users[str(i)] = user

    # --- Generate a plate for this user ---
    plate_id = randint(10000, 99999)
    plate = {
        "id": plate_id,
        "user_id": user_id,
        "plate": f"GR-{randint(1000,9999)}-{randint(10,25)}",
        "vehicle_make": choice(makes),
        "vehicle_model": choice(models),
        "vehicle_color": choice(colors),
        "vehicle_year": randint(2005, 2025),
        "is_primary": True,
        "notes": "",
        "created_at": now,
        "updated_at": now,
        "is_active": True,
    }
    plates[str(i)] = plate

# Save back to file
data["users"] = users
data["plates"] = plates

with open("acdnsys.json", "w") as file:
    json.dump(data, file, indent=4)

print(json.dumps(data, indent=4))
