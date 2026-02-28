const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("Nutri-ID Blockchain System", function () {
    let healthID, healthRecord;
    let owner, doctor, citizen;

    before(async function () {
        [owner, doctor, citizen] = await ethers.getSigners();

        // 1. Deploy HealthID (SBT)
        const HealthID = await ethers.getContractFactory("HealthID");
        healthID = await HealthID.deploy();
        await healthID.waitForDeployment();

        // 2. Deploy HealthRecord
        const HealthRecord = await ethers.getContractFactory("HealthRecord");
        healthRecord = await HealthRecord.deploy(await healthID.getAddress());
        await healthRecord.waitForDeployment();
    });

    describe("HealthID - Soulbound Token", function () {
        it("Should mint a new SBT for a citizen", async function () {
            // Owner (Ministry) sets NIP Hash, Blood Type, CMU Status
            await expect(healthID.connect(owner).mintID(
                citizen.address,
                "hash_nip_123",
                "O+",
                true
            )).to.emit(healthID, "IDMinted")
                .withArgs(citizen.address, 1, "hash_nip_123");

            const tokenId = await healthID.walletToTokenId(citizen.address);
            expect(tokenId).to.equal(1n);
        });

        it("Should allow the citizen to fetch their identity info", async function () {
            const info = await healthID.connect(citizen).getMyInfo();
            expect(info[0]).to.equal("hash_nip_123");
            expect(info[1]).to.equal("O+");
            expect(info[2]).to.equal(true);
        });

        it("Should revert if trying to transfer the Soulbound Token", async function () {
            await expect(
                healthID.connect(citizen).transferFrom(citizen.address, doctor.address, 1n)
            ).to.be.revertedWith("HealthID: This is a Soulbound Token. It cannot be transferred.");
        });
    });

    describe("HealthRecord - IPFS Storage", function () {
        it("Should authorize a doctor", async function () {
            await expect(healthRecord.connect(owner).setDoctorAuthorization(doctor.address, true))
                .to.emit(healthRecord, "DoctorAuthorized")
                .withArgs(doctor.address, true);
        });

        it("Should allow an authorized doctor to add an IPFS record to a valid HealthID", async function () {
            const tokenId = 1n; // Minted in the previous test block
            const ipfsCID = "QmTest123CID456";
            const docHash = "0xABCDEF...";
            const recordType = "PRESCRIPTION";

            await expect(healthRecord.connect(doctor).addRecord(
                tokenId,
                ipfsCID,
                docHash,
                recordType
            )).to.emit(healthRecord, "RecordAdded")
                .withArgs(tokenId, doctor.address, docHash, recordType);

            const recordCount = await healthRecord.getRecordCount(tokenId);
            expect(recordCount).to.equal(1n);

            const record = await healthRecord.getRecord(tokenId, 0);
            expect(record.ipfsCID).to.equal(ipfsCID);
            expect(record.doctor).to.equal(doctor.address);
        });

        it("Should deny adding a record to a non-existent HealthID", async function () {
            await expect(healthRecord.connect(doctor).addRecord(
                999n, // Does not exist
                "QmHacked",
                "0xBAD...",
                "VACCINE"
            )).to.be.reverted; // Reverts with "ERC721NonexistentToken" or "Invalid HealthID Token"
        });

        it("Should deny an unauthorized user from adding a record", async function () {
            await expect(healthRecord.connect(citizen).addRecord(
                1n,
                "QmHacked",
                "0xBAD...",
                "VACCINE"
            )).to.be.revertedWith("Not an authorized doctor");
        });
    });
});
