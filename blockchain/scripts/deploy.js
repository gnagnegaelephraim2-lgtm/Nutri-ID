const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const network = hre.network.name;
    console.log(`\nStarting Nutri-ID deployment on network: ${network}`);
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // 1. Deploy HealthID (SBT)
    console.log("\nDeploying HealthID (Soulbound Token)...");
    const HealthID = await hre.ethers.getContractFactory("HealthID");
    const healthID = await HealthID.deploy();
    await healthID.waitForDeployment();
    const healthIDAddress = await healthID.getAddress();
    console.log(`✅ HealthID (SBT) deployed to: ${healthIDAddress}`);

    // 2. Deploy HealthRecord (linked to HealthID)
    console.log("\nDeploying HealthRecord...");
    const HealthRecord = await hre.ethers.getContractFactory("HealthRecord");
    const healthRecord = await HealthRecord.deploy(healthIDAddress);
    await healthRecord.waitForDeployment();
    const healthRecordAddress = await healthRecord.getAddress();
    console.log(`✅ HealthRecord deployed to: ${healthRecordAddress}`);

    // 3. Save addresses to deployed_addresses.json for use by backend + frontend
    const addresses = {
        network,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployedAt: new Date().toISOString(),
        HealthID: healthIDAddress,
        HealthRecord: healthRecordAddress,
    };

    const outputPath = path.join(__dirname, "..", "deployed_addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
    console.log(`\n📄 Contract addresses saved to: ${outputPath}`);

    // 4. Sync ABIs + addresses to frontend/contracts/ for the browser to consume
    const frontendContractsDir = path.join(__dirname, "..", "..", "frontend", "contracts");
    if (!fs.existsSync(frontendContractsDir)) {
        fs.mkdirSync(frontendContractsDir, { recursive: true });
    }

    // Copy deployed_addresses.json
    fs.copyFileSync(outputPath, path.join(frontendContractsDir, "deployed_addresses.json"));

    // Copy HealthID ABI
    const healthIDArtifact = path.join(__dirname, "..", "artifacts", "contracts", "HealthID.sol", "HealthID.json");
    fs.copyFileSync(healthIDArtifact, path.join(frontendContractsDir, "HealthID.json"));

    // Copy HealthRecord ABI
    const healthRecordArtifact = path.join(__dirname, "..", "artifacts", "contracts", "HealthRecord.sol", "HealthRecord.json");
    fs.copyFileSync(healthRecordArtifact, path.join(frontendContractsDir, "HealthRecord.json"));

    console.log(`🔗 ABIs synced to frontend/contracts/`);
    console.log("   → HealthID.json");
    console.log("   → HealthRecord.json");
    console.log("   → deployed_addresses.json");
    console.log("\n📌 Next steps:");
    console.log("   1. Open frontend/index.html in your browser");
    console.log("   2. Add MetaMask network: http://127.0.0.1:8545, Chain ID 31337");
    console.log("   3. Navigate to #health-id and connect your wallet");
    console.log(`\n   HealthID Contract: ${healthIDAddress}`);
    console.log(`   HealthRecord Contract: ${healthRecordAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
