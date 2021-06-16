const expect = require("chai").expect;
const ganache = require("ganache-cli");
const Web3 = require("web3");
const { interface, bytecode } = require("../compile");

const web3 = new Web3(ganache.provider());

let lottery, accounts;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();
	lottery = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({ data: bytecode })
		.send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery", () => {
	it("deploys a contract", () => {
		expect(lottery.options.address).to.be.ok;
	});

	it("allows one account to enter", async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei("0.02", "ether")
		});

		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});

		expect(players[0]).to.be.equal(accounts[0]);
		expect(players).to.have.lengthOf(1);
	});

	it("allows multiple accounts to enter", async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei("0.02", "ether")
		});
		await lottery.methods.enter().send({
			from: accounts[1],
			value: web3.utils.toWei("0.02", "ether")
		});
		await lottery.methods.enter().send({
			from: accounts[2],
			value: web3.utils.toWei("0.02", "ether")
		});

		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});

		expect(players).to.deep.equal(accounts.slice(0, 3));
		expect(players).to.have.lengthOf(3);
	});

	it("requires a minimum amount of ether to enter", async () => {
		try {
			const invalidTransaction = await lottery.methods.enter().send({
				from: accounts[0],
				value: 0
			});
		} catch (err) {
			expect(err).to.exist;
		}
	});

	it("only manager can pick a winner", async () => {
		try {
			await lottery.methods.pickWinner().send({
				from: accounts[1]
			});
		} catch (err) {
			expect(err).to.exist;
		}
	});

	it("sends money to the winner and resets the playars array", async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei("2", "ether")
		});

		const initialBalance = await web3.eth.getBalance(accounts[0]);

		await lottery.methods.pickWinner().send({
			from: accounts[0]
		});

		const finalBalance = await web3.eth.getBalance(accounts[0]);
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});
		const balance = finalBalance - initialBalance;

		expect(balance > web3.utils.toWei("1.8", "ether")).to.be.true;
		expect(players).to.have.lengthOf(0);
	});
});
