package com.xjb.bingli;
import org.junit.Test;

public class UpdatePolicyTest {
    private static final String HASH="a".repeat(64);
    @Test public void validDownload() { UpdatePolicy.verifyDownload(10,10,HASH,HASH.toUpperCase()); }
    @Test(expected=IllegalArgumentException.class) public void truncatedDownload() { UpdatePolicy.verifyDownload(10,9,HASH,HASH); }
    @Test(expected=IllegalArgumentException.class) public void corruptedDownload() { UpdatePolicy.verifyDownload(10,10,HASH,"b".repeat(64)); }
    @Test(expected=IllegalArgumentException.class) public void oversizedDownload() { UpdatePolicy.verifyDownload(101L*1024*1024,101L*1024*1024,HASH,HASH); }
    @Test public void validUpgrade() { UpdatePolicy.verifyArchive("p","p",1,2,2,HASH,HASH,"2","2"); }
    @Test(expected=IllegalArgumentException.class) public void rejectDowngrade() { UpdatePolicy.verifyArchive("p","p",2,1,1,HASH,HASH,"1","1"); }
    @Test(expected=IllegalArgumentException.class) public void rejectDifferentPackage() { UpdatePolicy.verifyArchive("p","q",1,2,2,HASH,HASH,"2","2"); }
    @Test(expected=IllegalArgumentException.class) public void rejectDifferentSigner() { UpdatePolicy.verifyArchive("p","p",1,2,2,HASH,"b".repeat(64),"2","2"); }
    @Test(expected=IllegalArgumentException.class) public void rejectDifferentVersion() { UpdatePolicy.verifyArchive("p","p",1,2,3,HASH,HASH,"2","3"); }
}
