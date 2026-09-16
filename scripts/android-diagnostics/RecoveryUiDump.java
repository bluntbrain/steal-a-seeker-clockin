package seeker.diagnostics;
import com.android.uiautomator.testrunner.UiAutomatorTestCase;
import com.android.uiautomator.core.Configurator;
/** Test-side accessibility snapshot. Never changes application state. */
public class RecoveryUiDump extends UiAutomatorTestCase {
    public void testDump() {
        Configurator.getInstance().setWaitForIdleTimeout(0);
        getUiDevice().dumpWindowHierarchy("/sdcard/recovery-test.xml");
    }
}
