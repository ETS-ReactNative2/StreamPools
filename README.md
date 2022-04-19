# Stream Pools

Simple yield-earning digital asset streaming solution.


## Introduction

Digital assets are becoming more and more ubiquitous. One of the inherent trends regarding that is the fact that there are, and will likely be even more people receiving tokens as compensation for their work. Not only stablecoins but also tokens of the projects and protocols they work for. What it will lead to is the fact that there will be an increased number of people willing to pay for services and goods in digital assets, and naturally, an increased number of businesses willing to accept them as a form of payment.

Such a situation requires new solutions and the good news is that we do not have to recreate traditional payment systems on-chain. Blockchain technology allows us to create entirely new interesting solutions that have not been possible before. Solutions that are more optimized towards the common good of the payer and beneficiary. This project is a simple example of such a solution and it focuses on the concept of digital assets (money) streaming.


## Background

A person that coined the term 'money streaming' was Andreas Antonopulous, a writer and probably one of the most recognized Bitcoin advocates. His observation was brilliant. As a society, we've been dealing with money in form of discrete payments for generations. Humankind has been using physical money for so long that it got everyone entrenched in an archaic mental model. However, with blockchain technology money can become a real-time thing. Let's think of payments for anything - installments, rent, utilities, mortgage, tuition, but also salary. All of them are types of recurring payments and are paid once a week/month/quarter. Most of them are expenses and usually, there's only one type of payment we are beneficiary of - salary. In general, we are used to the fact of measuring prices in discrete units. I.e. we'd think that an apartment we're about to rent will cost us `$2000` a month rather than `$7.72e-4` per second because it naturally has more meaning. However, we'd also think that we'll need to pay for that apartment on the 5th of every month, a second after we'd recall that we'll need to pay the tuition fee on the 2nd of the next month. And then we'd realize that our salary is paid out on the 10th and if we really want to rent that apartment, the next few weeks will be tough to survive financially. Even though technically we'd afford that easily, it's just an unfortunate order of expenses and salary payments which require us to have either savings or borrow some money short-term. That's the type of situation that probably happened to all of us at least once, but for many it's a usual every month drill.


## Use case

What if that could look different? Let's tweak the mental model. What if the apartment could be paid `$7.72e-4` per second beginning on the 5th when we move in, the tuition payment had been set up to `$10e-4` per second on the day we began studies and our employer pays us `$30e-4` per second steadily, realtime. We'd have roughly `$12e-4` per second to spend on other stuff. The money flow would become a real continuous money flow, wouldn't it? As long as our net flow keeps positive we're in good financial health. When it starts leaning towards negative values it's a clear indication that we don't afford our lifestyle anymore. Does anyone still need a credit score check? Imagine accounting in business made based on such money streams - streams of money coming in and streams of money coming out.

Digital assets (money) streams are possible today, thanks to blockchain technology. However, the benefits do not end here. Important to emphasize is the fact that digital assets have no borders. It doesn't matter at all if I want to pay a person/business in the country I live in or on the other side of the globe, and it's quick. Quicker than with any traditional payment provider. It'd be especially convenient for businesses that are already being paid for their services in digital assets or accept them as a form of payment. They would not have to off ramp to traditional finance to acquire FIAT money to fulfill their obligations. It'd also be convenient for those beneficiaries that want to get exposure to 'crypto' as they would directly be paid in digital assets without a need to on ramp.

Lastly, on top of this pie we can put a cherry. What if our streams can generate additional passive income? Thanks to the existence of on-chain money markets in form of lending protocols it's also possible. Let's imagine being a business owner that sets aside funds for payroll. Those funds sit idly or accrue some modest interest on traditional savings account until they're paid out to one's employees. But it does not have to be the case anymore. Those funds can earn competitive interest on one of the lending protocols out there while continuously being streamed to the employees. It's not the end. After the funds are credited to the employees on a per-second basis, they also can earn interest for employees until withdrawn. 

As the world is too complex to be changed all at once, the `Stream Pools` project proposes a simple solution that can be used for streaming in from one-to-many model, i.e. from a company to its contractors/employees. More details are below.


## Market Research

### The first mover

The first person to try their best to implement the concept of money streaming was Paul Razvan Berg. He is the author of [EIP-1620: Money Streaming](https://eips.ethereum.org/EIPS/eip-1620) and the founder of [Sablier](https://sablier.finance/). Although the EIP-1620 has never become a living standard (the proposal has not been passed and is stagnant) it clearly laid out the motivation behind and specification. The goal was to achieve a "standardized interface [that] aims to change the way we think about long-term financial commitments. Thanks to blockchains, payments need not be sent in chunks (e.g. monthly salaries), as there is much less overhead in paying-as-you-go. Money as a function of time would better align incentives in a host of scenarios". Berg implemented this vision by bringing to life Sablier, the protocol for real-time finance built on top of ERC-1620. With "payday, every day", Sablier tries to solve the problem of discrete salary payments by setting up streams of assets from employers to employees who can withdraw as much as they earned to date without the need to wait until payday. Sablier is currently present on Ethereum, Arbitrum, Avalanche, BSC, Optimism and Polygon and until Jul 10th, 2021 (the most recent data) helped to create [978 salary streams](https://dune.xyz/queries/7513).

The implementation of Sablier's streams is simple. Every ERC-20-token-based stream has a sender, a recipient, a fixed deposit and a total streaming duration. One sender = one recipient = one stream. The funds are deposited in the smart contract and get unlocked to the recipient as a function of time. If somebody wants to send a token to multiple people, they have to create multiple streams. The streams cannot be modified after creation.


### Second iteration

It didn't take much time for a new generation of asset streaming solutions to appear. [Superfluid](https://www.superfluid.finance/home) takes it to a whole different level. Unlike Sablier, they provide a solution that does not require capital lockups. It's enough to maintain the balance over a certain level to keep the streams open. Superfluid provides a new token standard that acts as a wrapper over any token. When wrapped, a token gains new real-time streaming functionalities that are gas-less and capital efficient. The solution is composable and modular, but also way more complex than Sablier. As there's no lockup required so to keep the protocol healthy Superfluid had to come up with a solvency assessment and liquidations mechanism. For that third-party actors have to be engaged and incentivized to constantly keep an eye on the protocol and close the streams if they violate the rules. It's a trade-off between a requirement of a lock-up that freezes the assets until they're spent and capital efficiency that lets the users create the streams with a minimal amount of funding and requires them to maintain a healthy balance.

Superfluid is currently present on Arbitrum, Gnosis Chain, Optimism and Polygon. According to the [Dune Analytics dashboard](https://dune.xyz/msilb7/Testing-Superfluid) that provides data from Polygon, there's currently ca. $3.8 million/month flowing through Superfluid.


### Built on top

Both Sablier and Superfluid grasped the attention of the industry, being considered useful primitives of the DeFi space. In 2020 Sablier was acquired by lending protocol Mainframe (currently HiFi Finance) and Paul Berg joined the company as the head of development. [Acquisition happened due to Mainframe's plan to use Sablier's technology in their fixed-rate lending protocol](https://blog.hifi.finance/mainframe-acquires-sablier-finance-8eecc8b3c69b).

Superfluid, on the other hand, is used by Diagonal team that decided to build their crypto-native subscriptions payment system on top of Superfluid's streaming solution. Diagonal CEO, Tony Rosler, told [CoinDesk](https://www.coindesk.com/business/2022/03/04/diagonal-raises-25m-for-web-3-subscription-payments/) that his team’s goal is to provide Web 3 merchants "an entire product suite to make payments as simple as possible" from connecting wallets and processing payments to handling accounting and sending subscription notifications to customers. In March 2022 Diagonal announced the raising of $2.5 million in a pre-seed round co-led by Mechanism Capital.


### Market opportunity

When talking about Decentralized Finance (DeFi) it's always hard to precisely assess the market opportunity. The space has not matured yet and it's changing rapidly both due to the innovation, but also regulatory compliance. When we look at the Total Value Locked (TVL) in DeFi, we'll notice that it's growing. That growth indicates the growth of the industry as a whole and, what's inherent, the growth of the user base. We can only hope that the trend will be sustained and we'll welcome more and more blockchain-native people on board. As for the money streams themselves, it will take time. According to Antonopulous, it will take 15 years for people to fully understand what that is. [He said that](https://www.youtube.com/watch?v=gF_ZQ_eijPs&t=1369s) 5 years ago, hence we still have 10 years to go :)


### ROI

The protocol may earn for its operation by charging a service fee proportional to the interest accrued on the deposits within the platform. If we assume:
- taking a 25% 'success' fee on the interest
- the money flow on Stream Pools is equal to the money flow generated by Superfluid (as a reference), equal to [$3.8 million/month](https://dune.xyz/msilb7/Testing-Superfluid) at the time of writing
- 30-day average annual lending rate on DAI/USDT is equal to ca. [3%](https://defirate.com/lend/) at the time of writing

Stream Pools earnings would look as follows:
```
earnings = $3.8m x 12 x 3% x 25% ~= $340,000
```

Development of this relatively simple platform should not be too expensive and can easily be done by a team of 2 developers within a few weeks. Additional expenses would be required for marketing and community education. It's estimated that the total cost of the platform launch should not exceed $250k. Therefore ROI may be calculated as follows:
```
ROI = net return on investment / cost of investment = (earnings - cost of investment) / cost of investment = $340k - $250k / $250k = 36%
```

### Funding

The funds needed for the initial works may be acquired from grants that are given by the existing projects to the new projects willing to integrate with existing protocols. As integration with the money markets is vital for Stream Pools, it may be used as leverage to acquire initial funds for development from projects like Euler, Aave, Compound or others.


## Scope of the project

The following section will describe the unique approach proposed by `Stream Pools`.

### Requirements
1. `Stream Pools` should allow real-time assets transfer with second by second settlement
2. Once set up, the system should allow transfers in a gasless manner, leading to unobstructed value flow from the sender to the recipient
3. In its first version, `Stream Pools` should allow one-to-many types of transfer (salary-like payments from a business for many contractors/employees/beneficiaries). In the future it'd be possible to support an inverted situation - many-to-one types of transfer for payments like subscriptions, bills etc. where one business collects payments from many clients/customers
4. Recipients can withdraw funds anytime up to the amount earned at the time of withdrawal
5. Senders can withdraw funds anytime up to the amount satisfying obligations accrued until the time of withdrawal plus those that will accrue during the so-called cool-off period. This is to prevent the withdrawal of all the outstanding balance by the sender, leaving the obligations insolvent just a second after such a withdrawal
6. Streams should be updateable, however, recipients should be protected. Lowering the stream value or stream termination should satisfy the predefined notice period
7. It should be possible to assess whether the stream is solvent and for how long it will stay solvent. It is to notify the recipients whether the stream is healthy and for at least how long it will be
8. While the assets flow, the protocol should internally earn passive income both for the senders and for the recipients
9. The income should be earned by the recipients for as long as they keep their funds within the protocol
10. For the opportunity of the greatest customer base, the protocol should operate on Ethereum and EVM compatible chains
11. The protocol should support transfers of possibly any ERC-20 tokens
12. Graphical User Interface must be provided to ease user interaction with the protocol


### Benefits and features

The approach outlined above would have the following benefits:
1. Ease of executing recurring payments on-chain thanks to a user-friendly dApp
2. Removal of borders in international payments thanks to the nature of digital assets
3. Increased capital efficiency thanks to continuous real-time settlement
4. Earning passive income on top of the streams both by senders and beneficiaries thanks to integration with on-chain money markets
5. Liberation from the archaic model of finance thanks to the power of blockchain


## Architecture

### Smart contracts 

Initially `Stream Pools` are built on Ethereum from where they can be scaled to other EVM compatible chains and L2s. 

To earn passive income on the deposits, the protocol internally uses [Euler](https://euler.finance/) protocol, permissionless lending protocol. The motivation for this is two-fold. First, Euler protocol is a new generation lending protocol on Ethereum that leverages the security and capital efficiency. Second, it's permissionless meaning that anybody can create a new lending market. That feature has a direct impact on the `Stream Pools` as any asset already activated within Euler, is streamable on `Stream Pools` and will have a chance to generate passive income. Unlike the competitors like Aave or Compound, Euler supports more than 50 assets today while the other 1250 can easily be activated by anyone.

The initial version of the smart contract will not be upgradeable and for simplicity, it will be Euler-dependant. In the future, however, it'd be beneficial to have a more generic, upgradeable smart contract. 

The smart contract introduces a concept of a `Pool`. `Pool` can be created by anyone using the underlying asset already active on Euler. The sender deposits the underlying asset within the pool while the smart contract deposits it on Euler. From that point on the asset earns variable interest equal to the supply side interest rate on Euler. Then the sender creates `Streams` (one for each recipient), specifying the asset flow for each of them. Configurable parameters for each `Stream` are: 
- `startTime` - timestamp of when the asset should start flowing to the recipient
- `stopTime` - timestamp of when the asset should stop flowing to the recipient
- `underlyingRatePerSecond` - the amount of an underlying asset flowing to the recipient each second
- `noticePeriod` - minimal time needed to pass before stream parameters can be updated (used in case of a rate cut or termination, the notice must be given to a recipient)

To reduce the transaction fees, there can be a max of 10 `Streams` connected to a single `Pool`.

As mentioned before, streams can be updated in one of the following ways:
- `RAISE` - `underlyingRatePerSecond` increase
- `EXTENSION` - `stopTime` increase
- `CUT` - `underlyingRatePerSecond` decrease
- `TERMINATION` - `stopTime` decrease
For `CUT` and `TERMINATION` appropriate `noticePeriod` must be met before the stream gets updated.

Recipients can withdraw their funds anytime up to the amount credited to them to date. If they choose to keep the asset locked in the `Stream Pools`, they will still earn passive income from Euler. Although senders are also able to withdraw the proportion of their funds anytime, they must satisfy a `COOL_OFF_PERIOD` of one month that protects the recipients against the malicious sender. Hence, effectively the sender would be able to withdraw the following amount:

`amount to be withdrawn = initial deposit - total balance already credited to recipients - total rate per second * COOL_OFF_PERIOD`

Each user can check whether the `Pool` is solvent (by calling `isSolvent()` function) and for how long it will stay in that state considering the current asset flow. That information lets the recipient prepare for the fact that the stream may no longer be maintained by the sender and that the `Pool` may eventually run out of funds.

Possible interactions:
1. New pool creation, call `createPool()`
2. New stream creation, call `addRecipient()`
3. Deposit into existing pool, call `deposit()`
4. Withdraw from the pool/stream, call `withdraw()`
5. Schedule stream update, call `scheduleUpdate()`
6. Execute scheduled update, call `executeUpdate()`
7. Lock the pool state if insolvent, call `endAllStreams()`

State checking:
1. Get given pool info, call `getPool()`
2. Get given stream info, call `getStream()`
3. Get stream update info, call `getStreamUpdate()`
4. Check account balance, call `balanceOf()`
5. Check if pool is solvent, call `isSolvent()`


### Front-end

`Stream Pools` provides a simple website that helps the user to create and manage a `Pool` and `Streams`. The dApp is written in React.js and provides basic functionality for showcase purposes.

### Project plan

:white_check_mark: Creation of MVP 

:negative_squared_cross_mark: Creation of more advanced, upgradeable and generic smart contracts architecture. Ideally, integration with other lending protocols and yield aggregators

:negative_squared_cross_mark: Creation and launch of professional web application

:negative_squared_cross_mark: Marketing

:negative_squared_cross_mark: Scaling to different EVMs and L2s


## How to run

1. Clone the repository and install dependencies using the following commands:
```
git clone https://github.com/kasperpawlowski/StreamPools.git
cd frontend
npm install
```
2. Run the frontend and use the dApp. REMINDER: the dApp is configured to work on the Ropsten network only!
```
npm start
```

If one wants to redeploy the smart contracts the following has to be done:
1. Install hardhat dependencies
```
cd hardhat
npm install
```
2. Modify the smart contract
3. Rename the `.env_example` to `.env` and provide appropriate information in the file
4. Deploy the smart contract
```
npx hardhat run .\scripts\deploy.js --network ropsten
```
5. Change the `streamPools` address to the deployed contract address in the following file: `./frontend/src/components/AddressesContext.js`