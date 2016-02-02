'''
import subprocess

sqlNLP = "Who is Tom Cruise?"
print("Query: "  + sqlNLP)
print(subprocess.call("python quepy/examples/dbpedia/main.py '" + sqlNLP + "'", shell=True))
'''

 	
from nltk import load_parser
import nltk
nltk.data.show_cfg('grammars/book_grammars/sql.fcfg')

cp = load_parser('grammars/book_grammars/sql0.fcfg')
query = 'What cities are located in China'
trees = list(cp.parse(query.split()))
answer = trees[0].label()['SEM']
answer = [s for s in answer if s]
q = ' '.join(answer)
print(q)