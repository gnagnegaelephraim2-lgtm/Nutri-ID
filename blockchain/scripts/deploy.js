const hre = require("hardhat");

async function main() {
    console.log("Starting deployment for Nutri-ID to Polygon Amoy...");
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // 1. Deploy HealthID (SBT)
    const HealthID = await hre.ethers.getContractFactory("HealthID");
    const healthID = await HealthID.deploy();
    await healthID.waitForDeployment();
    const healthIDAddress = await healthID.getAddress();
    console.log(`✅ HealthID (SBT) deployed to: ${healthIDAddress}`);

    // 2. Deploy HealthRecord
    const HealthRecord = await hre.ethers.getContractFactory("HealthRecord");
    const healthRecord = await HealthRecord.deploy(healthIDAddress);
    await healthRecord.waitForDeployment();
    const healthRecordAddress = await healthRecord.getAddress();
    console.log(`✅ HealthRecord deployed to: ${healthRecordAddress}`);

    console.log("Deployment fully complete. Update the `.env` in the backend with these contract addresses.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
