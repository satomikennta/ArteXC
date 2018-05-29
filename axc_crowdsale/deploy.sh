source env.txt
echo "MNEMONIC="$MNEMONIC
echo "INFRA_ACCESS_TOKEN="$INFRA_ACCESS_TOKEN

read -p "Enter any key..."

truffle migrate --network ropsten --reset
