import subprocess

sqlNLP = "Who is Tom Cruise?"
print("Query: "  + sqlNLP)
print(subprocess.call("python quepy/examples/dbpedia/main.py '" + sqlNLP + "'", shell=True))
