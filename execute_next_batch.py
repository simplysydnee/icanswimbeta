#!/usr/bin/env python3
"""
Script to update next batch of emails for "Pending Parent Enrollment" records.
Sets 'Update email sent' = True to trigger email automation.
"""

import os
import sys
import requests

# Airtable configuration
BASE_ID = "appa5hlX697VP1FSo"
TABLE_ID = "tblXfCVX2NaUuXbYm"

# API endpoints
BASE_URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
HEADERS = {
    "Authorization": f"Bearer {os.environ.get('AIRTABLE_PERSONAL_ACCESS_TOKEN')}",
    "Content-Type": "application/json"
}

def check_auth_token() -> None:
    """Check if Airtable token is available in environment."""
    token = os.environ.get('AIRTABLE_PERSONAL_ACCESS_TOKEN')
    if not token:
        print("ERROR: Airtable personal access token not found in environment.")
        print("Please set: export AIRTABLE_PERSONAL_ACCESS_TOKEN='your_token_here'")
        sys.exit(1)

    HEADERS["Authorization"] = f"Bearer {token}"
    print("✓ Airtable token found in environment")

def update_records(records_to_update: list) -> None:
    """Update records in Airtable."""
    print(f"\nUpdating {len(records_to_update)} records...")

    # Update in batches of 10 (Airtable limit)
    batch_size = 10
    updated_count = 0

    for i in range(0, len(records_to_update), batch_size):
        batch = records_to_update[i:i + batch_size]
        records_payload = []

        for record in batch:
            records_payload.append({
                "id": record["id"],
                "fields": {
                    "Update email sent": True
                }
            })

        try:
            response = requests.patch(BASE_URL, headers=HEADERS, json={"records": records_payload})
            response.raise_for_status()
            updated_count += len(batch)

            # Print progress
            print(f"  Batch {i//batch_size + 1}: Updated {len(batch)} records")

            # Show first few records in first batch
            if i == 0:
                print(f"    Sample updates:")
                for j, record in enumerate(batch[:3]):
                    print(f"      • {record.get('client_name', 'Unknown')} ({record.get('email', 'No email')})")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to update batch {i//batch_size + 1}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

    print(f"\n✅ Successfully updated {updated_count} records")
    print(f"📧 Emails should now be triggered via automation")

def main():
    """Main function."""
    print("="*70)
    print("Update Next Email Batch")
    print("="*70)

    # Check authentication
    check_auth_token()

    # Records to update
    records_to_update = [
        {"id": "rec03icwOzjhs8bvk", "email": "RUIZCLAUDIA1996@GMAIL.COM", "client_name": "Ezekiel Suarez"},
        {"id": "recO3nIDYv4mcd8Ei", "email": "AGUIRRE_FAMILY@OUTLOOK.COM", "client_name": "Mina Rivera-Aguirre"},
        {"id": "rec78B3guTq2sW8dh", "email": "CLAU_DIA89@HOTMAIL.COM", "client_name": "Sebastian Garcia"},
        {"id": "rectq16l8AyM5bASp", "email": "JESSICAMONIQUEVASQUEZ@GMAIL.COM", "client_name": "Elias Rodriguez"},
        {"id": "recE3PwHiiext7vbN", "email": "CAMACHOESMERALDA93@GMAIL.COM", "client_name": "Adrian Lizama"},
        {"id": "rec7yclSLByZSHhb3", "email": "ROJASVERONICA1993@YAHOO.COM", "client_name": "Omar Jimenez Rojas"},
        {"id": "recMnvbDT95nFsWmk", "email": "DREAA203@GMAIL.COM", "client_name": "Natalia Medina"},
        {"id": "recUqdHUa1Brx1AK4", "email": "cr3611021@gmail.com", "client_name": "Jose Eseberre Reyes"},
        {"id": "recdYlfRFdGXGX8a7", "email": "REEDEBONY30@GMAIL.COM", "client_name": "Elaina Purnell"},
        {"id": "rec29ragBuQinrn15", "email": "OLIVIAFM23@GMAIL.COM", "client_name": "Israel Flores"},
        {"id": "reczP4MA3LRuvylut", "email": "MRS.RODGERS51197@GMAIL.COM", "client_name": "Bradley Rodgers"},
        {"id": "recC1kDucq7oKayN3", "email": "HERNANDEZJORDAN823@YAHOO.COM", "client_name": "Talulah Hernandez"},
        {"id": "recQCGYViyP587Pq3", "email": "JESS.GREENE20@YAHOO.COM", "client_name": "Shadeaux Greene"},
        {"id": "rec5sDqYWCqC35GSI", "email": "JESS.GREENE20@YAHOO.COM", "client_name": "PRISEIS GREENE"},
        {"id": "recZPNEdVAzEfiI0v", "email": "SOFIA_ALVAREZ07@ICLOUD.COM", "client_name": "Sebastian Luna"},
        {"id": "reclezfOjKTZQpiv0", "email": "Aliciapeaslee81@gmail.com", "client_name": "Piper Peaslee "},
        {"id": "recUktkq2jUcmUxVc", "email": "MIRELLANARANJO209@GMAIL.COM", "client_name": "Samantha Naranjo"},
        {"id": "rec63jbhhghM75b4w", "email": "MIRELLANARANJO209@GMAIL.COM", "client_name": "Isabella Naranjo"},
        {"id": "recc2RY8w8mQXAMf8", "email": "STACY44BIO@GMAIL.COM", "client_name": "Henry Tavares"},
        {"id": "recOEG7pqJhKWoLnJ", "email": "TSANGHA87@GMAIL.COM", "client_name": "Satveer Sangha"},
        {"id": "recjNxodFnnPtaCCx", "email": "HANNAVELASQUEZ6@GMAIL.COM", "client_name": "Isaiah Deniz"},
        {"id": "recdPbECUFkhuM3I2", "email": "MAMAQUIN09@YAHOO.COM", "client_name": "Sebastian Marroquin"},
        {"id": "rec1f1cIdcVX3RXT4", "email": "NICOLEYLEOBECERRA222@GMAIL.COM", "client_name": "Gustavo Becerra Cardenas"},
        {"id": "rec9L5r5hncP1RDFb", "email": "MAXINE_JOHNNY@ICLOUD.COM", "client_name": "Justyn"},
        {"id": "recjpMZiFTJJpweGg", "email": "CONRM33@GMAIL.COM", "client_name": "Sophia Maloney"},
        {"id": "recPe59COGIcszrvT", "email": "BLUEBONNETDRIVE@GMAIL.COM", "client_name": "Jonathan Franco "},
        {"id": "recsNOHH1T9uts1xv", "email": "AMEZCUACRISTINA71@GMAIL.COM", "client_name": "Daniel Gomez"},
        {"id": "rec6F7Pl4K7GoChfA", "email": "MORGIED26@HOTMAIL.COM", "client_name": "Garrett Mabery"},
        {"id": "rechEf1Ccy8AdsKrL", "email": "CEJA607@YAHOO.COM", "client_name": "Noah Fernandez"},
        {"id": "rec8X5FhQceqkOJM4", "email": "ISELA.C1122@YAHOO.COM", "client_name": "Ziyana Espinoza Huerta "},
        {"id": "rec17ePaufFQA5LRH", "email": "GBELHADI@GMAIL.COM", "client_name": "Adam Sebbah"},
        {"id": "recDsfg6efQhl0HUM", "email": "RUBYMTZ99@GMAIL.COM", "client_name": "Carmelo Vasquez Martinez"},
        {"id": "recQQb7Z7DQhbumEZ", "email": "CALDERONCINTHYA38@YAHOO.COM", "client_name": "Eric Moreno Calderon"},
        {"id": "reckz7c0RYtkUTis3", "email": "MRSAYALA2012@YAHOO.COM", "client_name": "Anthony Ayala"},
        {"id": "rec4L8pJJaPl023nW", "email": "NORMAVAZQUEZ21@YAHOO.COM", "client_name": "Aaron Zamora Vazquez"},
        {"id": "recunkPJqHw4LFpLV", "email": "ALIYAHHALL461@GMAIL.COM", "client_name": "Dae'Mani Wise"},
        {"id": "rec2HaZ58CQ57tQ1I", "email": "ALIYAHHALL461@GMAIL.COM", "client_name": "Dae'Mani Wise"},
        {"id": "recsoeBQUoRzwuxC1", "email": "CHANDNI_91@HOTMAIL.IT", "client_name": "MANTAJ CHAUHAN"},
        {"id": "recsmjMIe0Kj2npkk", "email": "PRAMIREZMSDV@GMAIL.COM", "client_name": "Benjamin Ramirez"},
        {"id": "reccre1pHmr3RUKSu", "email": "claudiahurtado456@icloud.com", "client_name": "Genesis Murillo "},
        {"id": "recc6cFtpX2X0nKHo", "email": "VIVI_PRZI@HOTMAIL.COM", "client_name": "Christian Montanez"},
        {"id": "recCtmR058BaKyqiu", "email": "JENLAR1978@GMAIL.COM", "client_name": "Lucas Black "},
        {"id": "rec4A3pvL0SrQSKTb", "email": "JULIEMEDEIROS31@YAHOO.COM", "client_name": "TRISTAN LARA"},
        {"id": "receBPhJHTvwfZsz6", "email": "chrbears@gmail.com", "client_name": "Abigail Wine "},
        {"id": "recj1y8ESdhC6iaR5", "email": "DEZIRAESANDERS1@GMAIL.COM", "client_name": "Dacian Sanders Bibbs"},
        {"id": "recvNVmXpIDn7hz6S", "email": "777SMOBILE@GMAIL.COM", "client_name": "MATTHEW KRYSHTAFOVYCH"},
        {"id": "recj3jl08uIn6cGzW", "email": "NAYELI034ALEMAN@GMAIL.COM", "client_name": "Sergio Rodriguez Aleman"},
        {"id": "recEDpJjia412GZlT", "email": "JREED062012@GMAIL.COM", "client_name": "Sophia Reed"},
        {"id": "rec6KV6BbY16aZCCp", "email": "DANIELLE.ELYSE.RAY@GMAIL.COM", "client_name": "Owen Reyes"},
        {"id": "recmzjdtLZRdDhoQ0", "email": "RUBIOROSARIO01@ICLOUD.COM", "client_name": "Adan Reyes Rubio"},
        {"id": "recVRke0VynkZxYaF", "email": "MARIAHLUZ231010@GMAIL.COM", "client_name": "Emiliano Rivera Reynoso"},
        {"id": "rec6RvJRfEA8kZ4rR", "email": "DTMEXI@GMAIL.COM", "client_name": "Logan Mexicano"},
        {"id": "recBIX4Do6nU50p8R", "email": "MIRIAMTORREZ531@GMAIL.COM", "client_name": "Damian Tapia"},
        {"id": "recYg6Wv52g8Mo1Pk", "email": "UJK_M@YAHOO.COM", "client_name": "Gursahib Uppal"},
        {"id": "recowdVsFiRn6xr2D", "email": "NESSA8102@GMAIL.COM", "client_name": "KENNETH BETSCHART"},
        {"id": "recXv7j2NzQiWqsNI", "email": "SHERYCEMADRIGAL@ROCKETMAIL.COM", "client_name": "Levi Sams"},
        {"id": "rec7WcxGtSKA1BgXk", "email": "SHERYCEMADRIGAL@ROCKETMAIL.COM", "client_name": "Jordan Sams"},
        {"id": "reckxSkzhtFZEk7CR", "email": "JAVIERCDIAZ09@GMAIL.COM", "client_name": "Benjamin Diaz"},
        {"id": "recRZiVh9rYHjTaSl", "email": "MVILLEDA009@GMAIL.COM", "client_name": "Felix Villeda"},
        {"id": "rechdcijsk6JzgKhB", "email": "JOYAMERINE@YAHOO.COM", "client_name": "Owen Kiely"},
        {"id": "recsYXxSzDUgfMqvi", "email": "Zlm12@yahoo.com", "client_name": "Hayden Myat"},
        {"id": "rec24SRWfA5DNvTlw", "email": "MERCADOM30@YAHOO.COM", "client_name": "Abraham Mercado"},
        {"id": "recwLRnzITaQomPBb", "email": "mariselagutierrezv18@gmail.com", "client_name": "Matteo Magana"},
        {"id": "recL5FF8yCrp1Ehmv", "email": "MAYRA.GONZALES861@GMAIL.COM", "client_name": "ELIJAH GONZALES"},
        {"id": "recbCyQ7OtBAmatqV", "email": "DARRAHCHILDERS@GMAIL.COM", "client_name": "Rylee King"},
        {"id": "reca5TNFw2LecCGXP", "email": "NEREFELINA83@GMAIL.COM", "client_name": "Raudel Enriquez "},
        {"id": "recRd5CzHFv9M5Qto", "email": "Vmmunoz83@outlook.com", "client_name": "Victorio Munoz"},
        {"id": "reczuUEQH5lKng5XK", "email": "OWANEKA@YAHOO.COM", "client_name": "Mateo Lewis"},
        {"id": "recVrNP7JAzwwJkGy", "email": "Rgarcia9783@yahoo.com", "client_name": "Daniel Ramirez Garcia"},
        {"id": "recKxiNg2W68CFOPC", "email": "Rgarcia9783@yahoo.com", "client_name": "Manuel Ramirez Garcia"},
        {"id": "recKGPaRajVv3AaB1", "email": "humdruminit@yahoo.com", "client_name": "Avarie Barrgan "},
        {"id": "recxhMEGBArzQE6vZ", "email": "FATIMASOUSAKASTER@GMAIL.COM", "client_name": "VINCENT KASTER"},
        {"id": "rec3MwkGLeU3f7JGD", "email": "APHRODITE.GATES@GMAIL.COM", "client_name": "Kavona Maxwell"},
        {"id": "rectI4fCoLkZjy1Gv", "email": "SVCAMPBELL6@GMAIL.COM", "client_name": "Diana Rodriguez-Campbell"},
        {"id": "rec7AdWmzQ4HvTNsh", "email": "LUVIAG408@GMAIL.COM", "client_name": "Denzel Fuentes"},
        {"id": "recqmATyAuWimiiCB", "email": "CALLESAMAYRANY99@GMAIL.COM", "client_name": "Jayden"},
        {"id": "recc9LoQQThx6yI7U", "email": "BETSIEVEGA15@GMAIL.COM", "client_name": "Noah Hernandez"},
        {"id": "rec2jnDiJJWRfrjWu", "email": "BETSIEVEGA15@GMAIL.COM", "client_name": "EEVEE   HERNANDEZ   "},
        {"id": "rece9j4mLnLrLcKrx", "email": "Chelcihopkins@yahoo.com", "client_name": "Luke Hopkins "},
        {"id": "recXKy3nOjnwUIv63", "email": "QUINTEROCARMELA40@GMAIL.COM", "client_name": "Guadalupe Quintero"},
        {"id": "rec2rSnmJaUvKa6Dp", "email": "ACEVEDO.J1@LIVE.COM", "client_name": "Pedro Mendez"},
        {"id": "rec1Tjifp0tF125OV", "email": "NANISTEW02@GMAIL.COM", "client_name": "Elias Ochoa"},
        {"id": "rec6RWvsDVmXHPOeC", "email": "PJAQUELINE98@YAHOO.COM", "client_name": "MERCADO, SOFIA   "},
        {"id": "recOVYnw4TLGM9XpC", "email": "MCKENNARANKIN209@YAHOO.COM", "client_name": "Jasper Giles-Mendoza"},
        {"id": "recn4LhJSZFOXfkEg", "email": "JESSLITTLE2@GMAIL.COM", "client_name": "BETSCHART, AILEEN  "},
        {"id": "recPmJWhxDw3sVtPl", "email": "GHULAMGHAFORI1973@GMAIL.COM", "client_name": "Hadia Ghafori"},
        {"id": "recsWrvr9QmV8bHU3", "email": "LOLISAG2012@ICLOUD.COM", "client_name": "Bruce Chaja"},
        {"id": "recmKw8fXfi4iBe1z", "email": "LIZETTEAVILA18@GMAIL.COM", "client_name": "Elijah Contreras"},
        {"id": "rec3qvQWTNMNFxgKj", "email": "MYRINDASIDE@GMAIL.COM", "client_name": "Gunner Clifton"},
        {"id": "recNqqo6ckD5pag1l", "email": "JASMINEHERRERA94@GMAIL.COM", "client_name": "Israel Morales-Maldon"},
        {"id": "recpqa159zlaC6P3y", "email": "CHRISTINAELOISA@GMAIL.COM", "client_name": "Isaias Zavala Jr"},
        {"id": "recuCa2oJy5srQ9Ud", "email": "MDELACRUZ111@GMAIL.COM", "client_name": "Isabella Elizalde"},
        {"id": "recaZDdrxXrW5xIgj", "email": "JMTORRES6886@GMAIL.COM", "client_name": "Alezanndra Torres"},
        {"id": "recT1ybSNquulqKZx", "email": "ULIBARRIDANIEL@GMAIL.COM", "client_name": "Stormi Ulbarri Alejandre"},
        {"id": "recPKvD04pcDABkmA", "email": "mayra.florjack15@gmail.com", "client_name": "Joseph Jackson"},
        {"id": "rectKyiTfPA3P9Bap", "email": "mayra.florjack15@gmail.com", "client_name": "John Jackson"},
        {"id": "recCHChYz0NrOX2df", "email": "JOCELYNRSMOS28@GMAIL.COM", "client_name": "Sebastian Negrete"},
        {"id": "reczyQ6ELRVpAD8XV", "email": "L.LYNETTE30@YAHOO.COM", "client_name": "Logan Serrano"},
        {"id": "reckncj7OrBgstkn1", "email": "L.LYNETTE30@YAHOO.COM", "client_name": "Xavier Serrano"},
        {"id": "receTwCvN3ODZ5Anp", "email": "GABRIELAGG2377@GMAIL.COM", "client_name": "Jonathan Arredondo"},
        {"id": "rec4aezXdf20aQQeG", "email": "KGHERNANDEZ33@GMAIL.COM", "client_name": "Francisco Hernandez"},
        {"id": "rec24ZTHUwtAgUuqU", "email": "LAYIS75@HOTMAIL.COM", "client_name": "Alexander Cruz"},
        {"id": "rec9jD58nxm2JXbn5", "email": "ARIANADELRIO82@GMAIL.COM", "client_name": "Hayley Rose Ceniceros"},
        {"id": "recfQx7ZmEhKh6KET", "email": "B_alvarado1012@yahoo.com", "client_name": "Yulianna Zuniga "},
        {"id": "recmdbnxKsLzwpoXm", "email": "ginaluvbal@yahoo.com", "client_name": "Sierra Anaya"},
        {"id": "rec0yRkqsFToXMQfx", "email": "IRENEACZUNIGA@YAHOO.COM", "client_name": "Jacob Zuniga"},
        {"id": "recHUUXTsr1gQItVf", "email": "REVRJOHNSON@GMAIL.COM", "client_name": "Matthew"},
        {"id": "recJwU65q72Z32Jsb", "email": "LOLISRODRIGUEZ15@ICLOUD.COM", "client_name": "Erick Fregoso"},
        {"id": "recVDghnfPmPqw26a", "email": "SNGGUGEL@GMAIL.COM", "client_name": "Salem Gugel"},
        {"id": "recilBsw5edlBxsLz", "email": "alex032038@yahoo.com", "client_name": "Anabelle Fausto"},
        {"id": "recvZIoX8pk6ArjC3", "email": "Cynthiavaldivias@yahoo.com", "client_name": "Aaron Fuentes-Deras"},
        {"id": "recYCrrWT1YqKI26Q", "email": "PINEDAPETRA402@GMAIL.COM", "client_name": "Mateo Escalera"},
        {"id": "recser3BpCAYaM4Qk", "email": "SUSANACONTRERAS2789@YAHOO.COM", "client_name": "Aleanna Saucedo"},
        {"id": "recH73kDqVDX0NiFy", "email": "VELLA.MARRIE01@GMAIL.COM", "client_name": "Bryrsten Turner Reed "},
        {"id": "recLofQZzo7QdzbDR", "email": "KFERRER510@GMAIL.COM", "client_name": "Kristopher Almanza"},
        {"id": "rec5P2MMPiInavCft", "email": "AVLYRIC@YAHOO.COM", "client_name": "Angel Valencia"},
        {"id": "rec9hYfjvggJxquPM", "email": "YANELLYMONTESINOS@YAHOO.COM", "client_name": "Eliasar Montesinos"},
        {"id": "recAAL3eQa0nSOHLd", "email": "KAWBLANCO@GMAIL.COM", "client_name": "Travis Blanco"},
        {"id": "recIcy5qD9Tx33rcE", "email": "ILOVEMYFAMILY2091@GMAIL.COM", "client_name": "Luis Padilla Jr"},
        {"id": "rec19jHu4SYKG2U3s", "email": "DAVINDER.GOLU@GMAIL.COM", "client_name": "Rehmat Gill"},
        {"id": "recgZHK6JrSvIFELW", "email": "GUADALUPE1394BARRAGAN@GMAIL.COM", "client_name": "Rosemary Rodriguez"},
        {"id": "recxVMKlrazVmvE4G", "email": "ELLIOTTALYSSA40@GMAIL.COM", "client_name": "Julianna Hollis"},
        {"id": "recJufsIdbOTdAAGx", "email": "WALCALA2@GMAIL.COM", "client_name": "Gerardo Madrigal "},
        {"id": "recG2Sb2voCAGt1vo", "email": "VMENDEZ307@YAHOO.COM", "client_name": "Isaias Guerrero "},
        {"id": "rec0VbdBvzpykeY3A", "email": "CELLIOTT1617@GMAIL.COM", "client_name": "Seth Elliott"},
        {"id": "rec8ZMlBaRBHJZisM", "email": "BRITANINYDAHL@YAHOO.COM", "client_name": "Lucas Edinger"},
        {"id": "rec0ObuBIIl7f627F", "email": "LUGAREO1989@GMAIL.COM", "client_name": "Camila Gutierrez"},
        {"id": "recxx8XeFPjLwo1fT", "email": "JSTONE@BODYBEAUTIFULTX.COM", "client_name": "Andrea Zamora"},
        {"id": "recGoOM3PRfFT8Lhj", "email": "JENNYTHACH209@YAHOO.COM", "client_name": "Dallas Thach-Phomma"},
        {"id": "reclxiYbxxc0KZt6d", "email": "MRS.ARIANACORTES@GMAIL.COM", "client_name": "Ariella Cortes"},
        {"id": "recQson47cnaXTEAa", "email": "SCHICKEWHAT@ICLOUD.COM", "client_name": "Everette Hodgson"},
        {"id": "recg4zfsJMSCL4NX1", "email": "OFELIABELLA87@GMAIL.COM", "client_name": "Manuel Goulart"},
        {"id": "recdK08f5GXOlNKII", "email": "MARILYNQUINTERO59@ICLOUD.COM", "client_name": "Christian Gonzales Quintero"},
        {"id": "recK4or9T4jI1XtXt", "email": "DEJAMERCER29@GMAIL.COM", "client_name": "Major Blacks"},
        {"id": "rec7z9zhbSBkM6cUH", "email": "MARTHAVALDESPINO1971@GMAIL.COM", "client_name": "Isaac Flores"},
        {"id": "recVvLrdmyQdzjVkp", "email": "NANCIELUNA@GMAIL.COM", "client_name": "Valerie Chavez"},
        {"id": "recL9TAufuwHoGktr", "email": "yolanda.hernandez1984.yh@gmail.com", "client_name": "Daynaret Reyes "},
        {"id": "rec7zXPkAkbNFYKbW", "email": "LIZMONARES17@YAHOO.COM", "client_name": "Aleya Ortiz"},
        {"id": "recN5vufzihxWJSmX", "email": "MAGIE.BETANCOURT87@ICLOUD.COM", "client_name": "Rey Betancourt "},
        {"id": "recCH6aOm0PC3oT4j", "email": "SHAYNA36518@GMAIL.COM", "client_name": "Grayson Clark "},
        {"id": "rec0LLjGm0b1pAYZZ", "email": "MONCADOO@YAHOO.COM", "client_name": "Joshua Lujan"},
        {"id": "recjkAajHgee9ILUc", "email": "APRIMEROPALMA@GMAIL.COM", "client_name": "Aaron Cordero "},
        {"id": "recJY8AItWr7rx19m", "email": "KAREM.VALENZUELA@YAHOO.COM", "client_name": "Matias Cajero"},
        {"id": "recFP1poa6d4I4Ey1", "email": "MAGGIETINOCO@GMAIL.COM", "client_name": "CHRISTOPHE TINOCO RAMIREZ "},
        {"id": "recZAYx1z9phmj5Mj", "email": "ARGUETAANA842@GMAIL.COM", "client_name": "CRISTIAN   RIVERA-ARGUETA"},
        {"id": "recmjmpgGzQmbZi9J", "email": "MAYHERRERA21@OUTLOOK.COM", "client_name": "Madylinn Herrera"},
        {"id": "recG1HiFOC0LkGl23", "email": "VAZQUEZMAR1@YAHOO.COM", "client_name": "Nathanael Vazquez"},
        {"id": "recEFgi48GEQgIL6i", "email": "MONTOYAJAZMIN21@GMAIL.COM", "client_name": "Antonio Segovia"},
        {"id": "recTsXdyFqjz6qBDp", "email": "GUADALUPESANDOVAL421@GMAIL.COM", "client_name": "Benjamin Ruiz"},
        {"id": "reckRxj8CePZC64m3", "email": "ROCHELLE.GAINES@ROCKETMAIL.COM", "client_name": "Thomas Moore"},
        {"id": "recsjArfwHMULvaC9", "email": "ALMASILVA040@GMAIL.COM", "client_name": "Eva Silva"},
        {"id": "recouFBIHTewAmEah", "email": "ANDRESX1987@YAHOO.COM", "client_name": "Juneva Orozco-Medina"},
        {"id": "recm0zlFAScebmTDM", "email": "NANCYLOPEZ9617@GMAIL.COM", "client_name": "Liam Lopez"},
        {"id": "recKtQfStC8Wz5mfv", "email": "MONICAJK122697@GMAIL.COM", "client_name": "Milaan Kumar"},
        {"id": "recQ6Uqx7xA4GaUrT", "email": "LUZMI8400@GMAIL.COM", "client_name": "Marcela Chavez"},
        {"id": "recxyMniybD8OKoc3", "email": "LUZMI8400@GMAIL.COM", "client_name": "Maria Chavez Ibanez"},
        {"id": "rec8hWjHj8vCXNoyl", "email": "Arianadelrio82@gmail.com", "client_name": "Christian Martinez"},
        {"id": "reczdrYbcH5Uw9AET", "email": "MAGUAYO90@YAHOO.COM", "client_name": "Lucas Verduzco"},
        {"id": "recT8zgR4Cvcf3P9b", "email": "ELIZABETHZENDEJAS217@GMAIL.COM", "client_name": "Rafael Martinez"},
        {"id": "recLKrudbFTMUNcLJ", "email": "TRELLAGALVEZ@GMAIL.COM", "client_name": "Josiah Montez"},
        {"id": "recwfztj6xfJbSuDM", "email": "VICTORIACONTRERAS759@YAHOO.COM", "client_name": "Diego Campos"},
        {"id": "rectHqNYuN9mrQDrC", "email": "TRELLAGALVEZ@GMAIL.COM", "client_name": "Israel Montez"},
        {"id": "recEfVvtQAAFKZW2N", "email": "GARZACARRILLO@YAHOO.COM", "client_name": "Arabella Harrell"},
        {"id": "recQ8VGJ7momWsztf", "email": "GRAJEDA.P@YAHOO.COM", "client_name": "Maricela Santillan"},
        {"id": "recQkLsUzvhBC3ITR", "email": "GAIL_SASSER@YAHOO.COM", "client_name": "Asher Schossow"},
        {"id": "recIDw1mDRBpS2pHn", "email": "CYNTHIA100981@GMAIL.COM", "client_name": "Ethan Franco Villa"},
        {"id": "reci7Q4xRqT4RFOc0", "email": "RO8489@HOTMAIL.COM", "client_name": "Jonah Rodriguez"},
        {"id": "recC5dvtxnlcrKrQy", "email": "CLAUDIA-1793@HOTMAIL.COM", "client_name": "Gustavo Mendez"},
        {"id": "recorSSkPWCReQtWy", "email": "CLAUDIA-1793@HOTMAIL.COM", "client_name": "Gissel Mendez"},
        {"id": "recIOpj9X4Y9OR5nV", "email": "HEATHERSHOFFNER1550@GMAIL.COM", "client_name": "Brayden Ramirez"},
        {"id": "recoYsIs6FyPUaxUP", "email": "SGOMEZ146981@GMAIL.COM", "client_name": "Lionel Olivar"},
        {"id": "recKXPVrA5ZKnz7ej", "email": "CROWNTRUCKING89@GMAIL.COM", "client_name": "Ekman Gill "},
        {"id": "reci3ZmdJvOXdDhhp", "email": "JONES.HOPE19@GMAIL.COM", "client_name": "Honest I Bagby "},
        {"id": "recblfyfdkRjHYkko", "email": "Latasha.hernandez@yahoo.com", "client_name": "Julian Hernandez"},
        {"id": "recgJwvGHBc6Nlq8o", "email": "MFRA1948@FRESHPOINT.COM", "client_name": "Samuel Franco"},
        {"id": "recPNwTOSFNrkYZuF", "email": "liliacalderonflores@gmail.com", "client_name": "Leonardo Iraheta Calderon"},
        {"id": "recaMDlxvaJTw4haL", "email": "AMEZCUACRISTINA71@GMAIL.COM", "client_name": "Daniel Gomez"},
        {"id": "recJuYsrMVcyVRGIV", "email": "MEJIA727@GMAIL.COM", "client_name": "Francisco Gutierrez Mejia"},
        {"id": "rec92NzQQSrHImz7i", "email": "JBMF209@GMAIL.COM", "client_name": "Marquise Williams "},
        {"id": "rectVr41pT1cimUav", "email": "SHALMAE888@GMAIL.COM", "client_name": "OMRION  MORLOCK"},
        {"id": "recjL4fryO7xFMRaq", "email": "KEONIE93@GMAIL.COM", "client_name": "David Poloai Jr"},
        {"id": "receo7IRn8LvUML6P", "email": "NFG2005@ATT.NET", "client_name": "Sabrina David "},
        {"id": "rech1B4DBYCieJS4U", "email": "CIERRA.DEATON08@GMAIL.COM", "client_name": "Avyn Deaton"},
        {"id": "recqXCnsPRkGViH56", "email": "CALITEJANO@GMAIL.COM", "client_name": "Athena Montalbo"},
        {"id": "recks6o1Ran779Ydf", "email": "C.MONTEJANO95@YAHOO.COM", "client_name": "Elijah Montejano Lopez"},
    ]

    # Confirm with user
    print(f"\nWill update {len(records_to_update)} records:")
    print("This will set 'Update email sent' = True and trigger email sending.")
    print("\nType 'YES' to continue: ", end="")

    confirmation = input().strip()
    if confirmation != "YES":
        print("\n❌ Update cancelled.")
        return

    # Update records
    update_records(records_to_update)

    print("\n" + "="*70)
    print("✅ Update complete!")
    print("="*70)

if __name__ == "__main__":
    main()
